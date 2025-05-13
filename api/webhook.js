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
    console.warn('🔍 Payload:', JSON.stringify(obj, null, 2));

    // 2) Grab the XCE username
    const username =
        obj.metadata?.xceusername ||
        (event.type === 'checkout.session.completed'
            ? (obj.custom_fields || [])
                .find(f => f.key === 'xceusername')
                ?.text?.value
            : null);
    console.warn('🆔 XCE username:', username || '<none>');

    // 3) Build a minimal `sub` with { id, current_period_end, items.data[0].price.id }
    let sub = null;

    if (event.type === 'checkout.session.completed' && obj.subscription) {
        // fetch the full subscription so we get current_period_end
        try {
            sub = await stripe.subscriptions.retrieve(obj.subscription);
        } catch (err) {
            console.error('❌ Error retrieving subscription:', err.message);
        }

    } else if (event.type === 'invoice.payment_succeeded' && obj.lines?.data?.[0]) {
        // use the invoice line period
        const line = obj.lines.data[0];
        const priceId = line.pricing?.price_details?.price;
        if (line.period?.end && priceId) {
            sub = {
                id: obj.subscription,
                current_period_end: line.period.end,
                items: { data: [{ price: { id: priceId } }] }
            };
        } else {
            console.warn('⚠️ Invoice missing period.end or price');
        }

    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        sub = obj; // full subscription payload
    }

    // 4) Upsert if we have both
    if (sub && username) {
        try {
            // this will write sub.current_period_end into acct.currentPeriodEnd
            const acct = await upsertAccount({ username, sub });

            // log just the raw Unix timestamp
            console.warn(
                `🔄 Upserted ${acct.username} → tier=${acct.tier}, expiresUnix=${acct.currentPeriodEnd}`
            );
        } catch (err) {
            console.error('❌ upsertAccount error:', err);
            return res.status(500).end();
        }

    } else if (sub && !username) {
        console.warn('⚠️ Skipping upsert: have sub but no username');
    }

    // 5) 200 OK
    res.json({ received: true });
}
