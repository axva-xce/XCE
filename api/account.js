// api/account.js

import { readAccounts, writeAccounts } from './db.js';

/**
 * Create or update the account, and store when the current paid period ends.
 */
export async function upsertAccount({ username, sub }) {
    if (!username) throw new Error('No username passed to upsertAccount');

    const accounts = await readAccounts();
    let acct = accounts.find(a => a.username === username);

    if (!acct) {
        // New user, free tier default:
        acct = {
            username,
            passwordHash: '',       // no password yet
            tier: 'T1',             // free tier
            stripeSubscriptionId: null,
            currentPeriodEnd: 0     // Unix timestamp seconds
        };
        accounts.push(acct);
    }

    // Update with subscription info:
    acct.stripeSubscriptionId = sub.id;
    acct.currentPeriodEnd = sub.current_period_end;
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
