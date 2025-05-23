import { buffer } from 'micro';
import Stripe from 'stripe';
import { upsertAccount } from './account.js';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.TEST_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }
    let event;
    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(
            buf,
            req.headers['stripe-signature'],
            process.env.TEST_STRIPE_WEBHOOK_SECRET
        );
        console.warn(`Stripe event: ${event.type}`);
    } catch (err) {
        console.error('Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const obj = event.data.object;
    console.warn('Payload:', JSON.stringify(obj, null, 2));

    const username =
        obj.metadata?.xceusername ||
        (event.type === 'checkout.session.completed'
            ? (obj.custom_fields || [])
                .find(f => f.key === 'xceusername')
                ?.text?.value
            : null);
    console.warn('XCE username:', username || '<none>');

    let subscriptionId = null;
    if (obj.subscription) {
        subscriptionId = obj.subscription;
    } else if (obj.lines?.data?.[0]?.parent?.subscription_details?.subscription) {
        subscriptionId = obj.lines.data[0].parent.subscription_details.subscription;
    }

    let sub = null;
    if (subscriptionId) {
        try {
            sub = await stripe.subscriptions.retrieve(subscriptionId);
            console.warn('Full Subscription object:', JSON.stringify(sub, null, 2));
        } catch (err) {
            console.error('Error retrieving subscription:', err.message);
        }
    } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
    ) {
        sub = obj
        console.warn('Subscription event payload has full object:', JSON.stringify(obj, null, 2));
    } else {
        console.warn('No subscription ID found in payload');
    }

    if (sub && username) {
        try {
            const acct = await upsertAccount({ username, sub });
            console.warn(`Upserted ${acct.username} → tier=${acct.tier}, expiresUnix=${acct.currentPeriodEnd}`);
        } catch (err) {
            console.error('upsertAccount error:', err);
            return res.status(500).end();
        }
    } else if (sub && !username) {
        console.warn('Skipping upsert: have subscription but no username');
    }
    res.json({ received: true });
}
