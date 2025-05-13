import { readAccounts, writeAccounts } from './db.js';
export async function upsertAccount({ username, sub }) {
    if (!username) throw new Error('No username passed to upsertAccount');
    const accounts = await readAccounts();
    let acct = accounts.find(a => a.username === username);
    if (!acct) {
        acct = {
            username,
            passwordHash: '',
            tier: 'T1',
            stripeSubscriptionId: null,
            currentPeriodEnd: 0
        };
        accounts.push(acct);
    }


    const item = sub.items?.data?.[0];
    acct.stripeSubscriptionId = sub.id;
    acct.currentPeriodEnd =
        sub.current_period_end ?? item?.current_period_end ?? 0;
    acct.tier = tierFromPrice(item?.price ?? {});

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
