import { buffer } from 'micro';
import Stripe from 'stripe';
import { readAccounts, writeAccounts } from './db';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    const buf = await buffer(req);
    let event;
    try {
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const email = event.data.object.customer_details?.email;
    if (email) {
        let sub;
        const obj = event.data.object;
        if (['checkout.session.completed', 'invoice.payment_succeeded'].includes(event.type)) {
            sub = await stripe.subscriptions.retrieve(obj.subscription);
        } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
            sub = obj;
        }
        if (sub) {
            const accounts = await readAccounts();
            const idx = accounts.findIndex(a => a.username === email);
            if (idx !== -1) {
                accounts[idx].stripeSubscriptionId = sub.id;
                accounts[idx].currentPeriodEnd = sub.current_period_end;
                accounts[idx].status = sub.status;
                await writeAccounts(accounts);
            }
        }
    }

    res.json({ received: true });
}
