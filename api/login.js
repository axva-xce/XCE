import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { readAccounts } from './db';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { username, password } = JSON.parse(req.body);
    const accounts = await readAccounts();
    const acct = accounts.find(a => a.username === username);
    if (!acct || !(await bcrypt.compare(password, acct.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
}
