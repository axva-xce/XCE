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
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(
            buf,
            req.headers['stripe-signature'],
            process.env.TEST_STRIPE_WEBHOOK_SECRET
        );
        console.warn(`✅ Stripe event: ${event.type}`);
    } catch (err) {
        console.error('❌ Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const obj = event.data.object;
    console.warn('🔍 Payload:', JSON.stringify(obj, null, 2));

    // 2) Extract username
    const username =
        obj.metadata?.xceusername ||
        (event.type === 'checkout.session.completed'
            ? (obj.custom_fields || [])
                .find(f => f.key === 'xceusername')
                ?.text?.value
            : null);
    console.warn('🆔 XCE username:', username || '<none>');

    // 3) If we have a subscription ID, always fetch the Subscription
    let sub = null;
    if (obj.subscription) {
        try {
            sub = await stripe.subscriptions.retrieve(obj.subscription);
            console.warn('🔍 Retrieved subscription:', {
                id: sub.id,
                current_period_end: sub.current_period_end,
                priceId: sub.items.data[0]?.price.id
            });
        } catch (err) {
            console.error('❌ Error retrieving subscription:', err.message);
        }
    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        // those payloads already *are* the subscription object
        sub = obj;
    }

    // 4) Upsert if we have both
    if (sub && username) {
        try {
            const acct = await upsertAccount({ username, sub });
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

    // 5) Acknowledge
    res.json({ received: true });
}
