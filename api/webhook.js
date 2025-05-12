// /api/webhook.js

import { buffer } from 'micro';
import Stripe from 'stripe';
// ← point at your helper, not db.js
import { upsertAccount } from './account.js';

export const config = { api: { bodyParser: false } };

// Initialize Stripe
const stripe = new Stripe(process.env.TEST_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    // Grab raw body to verify signature
    const buf = await buffer(req);
    let event;
    try {
        const sig = req.headers['stripe-signature'];
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

    // === extract username ===
    let username =
        // 1) metadata on subscription (if you set it)
        event.data.object.metadata?.xceusername ||
        // 2) metadata on session/customer
        event.data.object.metadata?.xceusername ||
        event.data.object.customer_details?.metadata?.xceusername ||
        // 3) fallback for custom_fields on checkout.session.completed
        (event.type === 'checkout.session.completed'
            ? (event.data.object.custom_fields || [])
                .find(f => f.key === 'xceusername')
                ?.text?.value
            : null);

    console.warn('🆔 XCE username:', username || '<none>');

    // === pull the Subscription object ===
    let sub = null;
    const obj = event.data.object;
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
        sub = await stripe.subscriptions.retrieve(obj.subscription);
    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        sub = obj;
    }

    // === upsert in Upstash ===
    if (sub && username) {
        try {
            const acct = await upsertAccount({ username, sub });
            console.warn(`🔄 Upserted ${acct.username} → tier=${acct.tier}, status=${acct.status}`);
        } catch (err) {
            console.error('❌ upsertAccount error:', err);
            return res.status(500).end();
        }
    } else {
        console.warn('⚠️ Missing subscription or username, skipping upsert');
    }

    // Acknowledge
    res.json({ received: true });
}
