import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import { readAccounts, writeAccounts } from './db';

export const config = {
    api: {
        bodyParser: true,
    },
};
export default async function handler(req, res) {
    console.warn(`/api/signup ${req.method} invoked`);
    if (req.method === 'GET') {
        return res.status(200).send('Signup endpoint is live');
    }
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    console.warn('POST /api/signup body:', req.body);

    let username, password;
    try {
        ({ username, password } = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body);
    } catch (err) {
        console.error('Invalid JSON in request body', err);
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    let accounts;
    try {
        accounts = await readAccounts();
    } catch (err) {
        console.error('Error reading accounts from DB', err);
        return res.status(500).json({ error: 'Database error' });
    }

    if (accounts.find((a) => a.username === username)) {
        return res.status(400).json({ error: 'Username taken' });
    }

    let passwordHash;
    try {
        passwordHash = await bcrypt.hash(password, 10);
    } catch (err) {
        console.error('Error hashing password', err);
        return res.status(500).json({ error: 'Hashing error' });
    }

    const newAccount = {
        username,
        passwordHash,
        stripeSubscriptionId: null,
        currentPeriodEnd: 0,
        status: 'free',
    };
    accounts.push(newAccount);

    try {
        await writeAccounts(accounts);
    } catch (err) {
        console.error('Error writing accounts to DB', err);
        return res.status(500).json({ error: 'Database error' });
    }

    let token;
    try {
        token = jwt.sign({ username }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
    } catch (err) {
        console.error('Error signing JWT', err);
        return res.status(500).json({ error: 'Token error' });
    }

    console.warn(`New user signed up: ${username}`);
    res.status(201).json({ token });
}
