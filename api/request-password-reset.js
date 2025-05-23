import { readAccounts } from './db';

export const config = {
    api: {
        bodyParser: true,
    },
};

export default async function handler(req, res) {
    console.warn(`/api/request-password-reset ${req.method} invoked`);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let email;
    try {
        const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        email = requestBody.email;

        if (!email || typeof email !== 'string') {
            console.warn('Missing or invalid email in request body:', req.body);
            return res.status(400).json({ error: 'Email is required and must be a string' });
        }
    } catch (err) {
        console.error('Invalid JSON in request body for password reset', err);
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.warn(`Password reset requested for email: ${email}`);

    try {
        const accounts = await readAccounts();
        const accountExists = accounts.find(acc => acc.email === email);

        if (accountExists) {
            console.warn(`Account found for email: ${email} (user: ${accountExists.username}). Simulating password reset initiation.`);
        } else {
            console.warn(`No account found for email: ${email}. Still returning generic success message to prevent enumeration.`);
        }


        return res.status(200).json({ message: 'If an account with that email address exists, a password reset link has been sent.' });

    } catch (err) {
        console.error('Error during password reset request processing (e.g., DB read error):', err);
        return res.status(500).json({ error: 'An internal server error occurred while processing your request.' });
    }
}