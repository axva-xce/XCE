// api/webhook.js

import { buffer } from 'micro';
import Stripe from 'stripe';
import { upsertAccount } from './account.js';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.TEST_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // 1) Verify signature
    let event;
    try {
        const sig = req.headers['stripe-signature'];
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.TEST_STRIPE_WEBHOOK_SECRET
        );
        console.warn(`✅ Stripe event: ${event.type}`);
    } catch (err) {
        console.error('❌ Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const obj = event.data.object;

    // — Debug log —
    console.warn('🔍 Full Stripe payload:', JSON.stringify(obj, null, 2));

    // 2) Extract username
    const username =
        obj.metadata?.xceusername ||
        (event.type === 'checkout.session.completed'
            ? (obj.custom_fields || []).find(f => f.key === 'xceusername')?.text?.value
            : null);

    console.warn('🆔 XCE username:', username || '<none>');

    // 3) Build a “sub” object with id, current_period_end, and items.data[0].price.id
    let sub = null;

    if (event.type === 'checkout.session.completed' && obj.subscription) {
        // For a checkout session, fetch the full subscription
        sub = await stripe.subscriptions.retrieve(obj.subscription);

    } else if (event.type === 'invoice.payment_succeeded' && obj.subscription) {
        // For invoice events we can pull the period end & price straight off the invoice
        const line = obj.lines?.data?.[0];
        if (line && line.period && line.pricing?.price_details?.price) {
            sub = {
                id: obj.subscription,
                current_period_end: line.period.end,
                items: {
                    data: [
                        { price: { id: line.pricing.price_details.price } }
                    ]
                }
            };
        } else {
            console.warn('⚠️ invoice.payment_succeeded missing line/period info');
        }

    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        // Subscription events already include the complete object
        sub = obj;
    }

    // 4) Upsert if we have sub + username
    if (sub && username) {
        try {
            const acct = await upsertAccount({ username, sub });

            // Safe expiration formatting
            let expiresLog = 'n/a';
            if (acct.currentPeriodEnd && Number.isFinite(acct.currentPeriodEnd)) {
                expiresLog = new Date(acct.currentPeriodEnd * 1000).toISOString();
            }

            console.warn(
                `🔄 Upserted ${acct.username} → tier=${acct.tier}, expiresUnix=${acct.currentPeriodEnd}, expiresISO=${new Date(acct.currentPeriodEnd * 1000).toISOString()}`
            );

        } catch (err) {
            console.error('❌ upsertAccount error:', err);
            return res.status(500).end();
        }

    } else if (sub && !username) {
        console.warn('⚠️ Skipping upsert: have subscription but no username');
    }

    // 5) Acknowledge
    res.json({ received: true });
}
