// /api/webhook.js

import { buffer } from 'micro';
import Stripe from 'stripe';
import { upsertAccount } from './account.js';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.TEST_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // 1. Verify signature
    let event;
    try {
        const sig = req.headers['stripe-signature'];
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.TEST_STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('❌ Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.warn(`✅ Stripe event: ${event.type}`);

    // 2. Extract XCE username
    const obj = event.data.object;
    const username =
        // subscription metadata (if you add it, see below)
        obj.metadata?.xceusername ||
        // fallback: checkout-session custom_fields
        (event.type === 'checkout.session.completed'
            ? (obj.custom_fields || []).find(f => f.key === 'xceusername')?.text?.value
            : null);

    console.warn('🆔 XCE username:', username || '<none>');

    // 3. Determine subscription object
    let sub = null;

    if (event.type === 'checkout.session.completed') {
        // session → subscription ID on the session object
        if (obj.subscription) {
            sub = await stripe.subscriptions.retrieve(obj.subscription);
        } else {
            console.warn('⚠️ No subscription ID on checkout.session.completed');
        }

    } else if (event.type === 'invoice.payment_succeeded') {
        // invoice → subscription ID on the invoice object
        if (obj.subscription) {
            sub = await stripe.subscriptions.retrieve(obj.subscription);
        } else {
            console.warn('⚠️ invoice.payment_succeeded without subscription; skipping');
        }

    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        // subscription events contain the full subscription already
        sub = obj;
    }

    // 4. Upsert into Upstash if we have both
    if (sub && username) {
        try {
            const acct = await upsertAccount({ username, sub });
            console.warn(`🔄 Upserted ${acct.username} → tier=${acct.tier}, status=${acct.status}`);
        } catch (err) {
            console.error('❌ upsertAccount error:', err);
            return res.status(500).end();
        }
    } else if (sub && !username) {
        console.warn('⚠️ Skipping upsert: have subscription but no username');
    }

    // 5. Reply 200
    res.json({ received: true });
}
