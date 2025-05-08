import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { readAccounts, writeAccounts } from './db';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { username, password } = JSON.parse(req.body);
    const accounts = await readAccounts();
    if (accounts.find(a => a.username === username)) {
        return res.status(400).json({ error: 'Username taken' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    accounts.push({ username, passwordHash, stripeSubscriptionId: null, currentPeriodEnd: 0, status: 'free' });
    await writeAccounts(accounts);
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
}
