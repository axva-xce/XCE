import jwt from 'jsonwebtoken';
import { readAccounts } from './db';

export default async function handler(req, res) {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).end();
    let payload;
    try { payload = jwt.verify(auth, process.env.JWT_SECRET); }
    catch { return res.status(401).end(); }
    const accounts = await readAccounts();
    const acct = accounts.find(a => a.username === payload.username);
    if (!acct) return res.status(404).end();
    res.json({
        status: acct.status,
        current_period_end: acct.currentPeriodEnd,
        server_time: Math.floor(Date.now() / 1000)
    });
}
