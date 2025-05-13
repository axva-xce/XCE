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
            process.env.STRIPE_WEBHOOK_SECRET
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

    // 3) Find the subscription ID in the payload
    let subscriptionId = null;

    if (obj.subscription) {
        subscriptionId = obj.subscription;
    } else if (
        obj.lines?.data?.[0]?.parent?.subscription_details?.subscription
    ) {
        subscriptionId =
            obj.lines.data[0].parent.subscription_details.subscription;
    }

    // 4) If we have an ID, fetch the full Subscription
    let sub = null;
    if (subscriptionId) {
        try {
            sub = await stripe.subscriptions.retrieve(subscriptionId);
            console.warn('🔍 Retrieved subscription:', {
                id: sub.id,
                current_period_end: sub.current_period_end,
                priceId: sub.items.data[0]?.price?.id,
            });
        } catch (err) {
            console.error('❌ Error retrieving subscription:', err.message);
        }
    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        // those events *are* the Subscription object
        sub = obj;
        console.warn('🔍 Subscription event payload has full object');
    } else {
        console.warn('⚠️ No subscription ID found in payload');
    }

    // 5) Upsert if we have both
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
        console.warn('⚠️ Skipping upsert: have subscription but no username');
    }

    // 6) Ack Stripe
    res.json({ received: true });
}
