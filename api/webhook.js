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

    // 2) Extract username from metadata or custom_fields
    const username =
        obj.metadata?.xceusername ||
        (event.type === 'checkout.session.completed'
            ? (obj.custom_fields || []).find(f => f.key === 'xceusername')?.text?.value
            : null);

    console.warn('🆔 XCE username:', username || '<none>');

    // 3) Fetch the full Subscription object when needed
    let sub = null;
    if (event.type === 'checkout.session.completed' && obj.subscription) {
        sub = await stripe.subscriptions.retrieve(obj.subscription);
    } else if (event.type === 'invoice.payment_succeeded' && obj.subscription) {
        sub = await stripe.subscriptions.retrieve(obj.subscription);
    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        sub = obj;
    }

    // 4) Upsert only if we have both
    if (sub && username) {
        try {
            const acct = await upsertAccount({ username, sub });
            console.warn(
                `🔄 Upserted ${acct.username} → tier=${acct.tier}, expires=${new Date(
                    acct.currentPeriodEnd * 1000
                ).toISOString()}`
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
