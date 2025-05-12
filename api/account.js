import { readAccounts, writeAccounts } from './db.js';

/**
 * Create the user if missing, then update the Stripe fields.
 * Returns the up-to-date account object.
 */
export async function upsertAccount({ username, sub }) {
    if (!username) throw new Error('No username passed to upsertAccount');

    const accounts = await readAccounts();
    let acct = accounts.find(a => a.username === username);

    if (!acct) {
        // create a shell account with free tier & no password
        acct = {
            username,
            passwordHash: '',              // blank means “no password yet”
            tier: 'T1',                    // default free tier
            stripeSubscriptionId: null,
            currentPeriodEnd: 0,
            status: 'free'
        };
        accounts.push(acct);
    }

    // update subscription-related fields
    acct.stripeSubscriptionId = sub.id;
    acct.currentPeriodEnd = sub.current_period_end;
    acct.status = sub.status;       // e.g. active / canceled
    acct.tier = tierFromPrice(sub.items.data[0].price);

    await writeAccounts(accounts);
    return acct;
}

function tierFromPrice(price) {
    switch (price.id) {
        case process.env.PRICE_ID_T2: return 'T2';
        case process.env.PRICE_ID_T3: return 'T3';
        default: return 'T1';
    }
}