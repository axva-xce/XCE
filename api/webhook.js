import { buffer } from 'micro';
import Stripe from 'stripe';
import { readAccounts, writeAccounts } from './db';

export const config = { api: { bodyParser: false } };

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.TEST_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Only accept POSTs
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    // Grab the raw body for signature verification
    const buf = await buffer(req);
    let event;
    try {
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.TEST_STRIPE_WEBHOOK_SECRET
        );
        console.warn(`✅ Received Stripe event: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const customFields = event.data.object.custom_fields || [];
            const usernameField = customFields.find(f => f.key === 'xceusername');
            const purchasedFor = usernameField?.text?.value;
            console.warn(`🆔 XCE Username from Checkout: ${purchasedFor}`);
        }

    } catch (err) {
        console.error(`❌ Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Extract the customer email
    const email = event.data.object.customer_details?.email;
    if (email) {
        let sub;
        const obj = event.data.object;

        // For initial checkout or successful invoice payment, fetch the full subscription
        if (
            event.type === 'checkout.session.completed' ||
            event.type === 'invoice.payment_succeeded'
        ) {
            sub = await stripe.subscriptions.retrieve(obj.subscription);
        }
        // For updates and cancellations, the subscription object is in the payload
        else if (
            event.type === 'customer.subscription.updated' ||
            event.type === 'customer.subscription.deleted'
        ) {
            sub = obj;
        }

        if (sub) {
            // Load your accounts array from Upstash
            const accounts = await readAccounts();
            const idx = accounts.findIndex((a) => a.username === email);

            if (idx !== -1) {
                // Update the record in place
                accounts[idx].stripeSubscriptionId = sub.id;
                accounts[idx].currentPeriodEnd = sub.current_period_end;
                accounts[idx].status = sub.status;
                await writeAccounts(accounts);
                console.warn(`🔄 Updated subscription for ${email}:`, sub.status);
            } else {
                console.warn(`⚠️ No account found for email ${email}`);
            }
        }
    } else {
        console.warn('⚠️ Event did not include customer_details.email');
    }

    // Acknowledge receipt
    res.json({ received: true });
}
