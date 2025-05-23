import { readAccounts } from './db';
import nodemailer from 'nodemailer';
import { Redis } from '@upstash/redis';

const redisClientForCodes = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const config = {
    api: {
        bodyParser: true,
    },
};

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
    console.warn(`/api/request-password-reset ${req.method} invoked`);

    if (req.method === 'GET') {
        console.log("/api/request-password-reset GET invoked by browser or test");
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let emailToReset;
    try {
        const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        emailToReset = requestBody.email;

        if (!emailToReset || typeof emailToReset !== 'string') {
            console.warn('Missing or invalid email in request body:', req.body);
            return res.status(400).json({ error: 'Email is required and must be a string' });
        }
    } catch (err) {
        console.error('Invalid JSON in request body for password reset', err);
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.warn(`Password reset requested for email: ${emailToReset}`);

    try {
        const accounts = await readAccounts();
        const accountExists = accounts.find(acc => acc.email === emailToReset);

        if (accountExists) {
            console.warn(`Account found for email: ${emailToReset} (user: ${accountExists.username}). Initiating password reset code generation.`);

            const resetCode = generateResetCode();
            const redisKey = `password_reset_code:${emailToReset}`;
            const expirySeconds = 15 * 60; // Code valid for 15 minutes

            await redisClientForCodes.set(redisKey, resetCode, { ex: expirySeconds });
            console.warn(`Reset code ${resetCode} stored in Redis for ${emailToReset} with key ${redisKey}, expires in ${expirySeconds}s.`);

            const transporter = nodemailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    ciphers: 'SSLv3'
                }
            });

            const mailOptions = {
                from: `"XCE No Reply" <${process.env.EMAIL_USER}>`,
                to: emailToReset,
                subject: 'Your XCE Password Reset Code',
                text: `Hello ${accountExists.username || 'User'},\n\nYour password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\nThanks,\nThe XCE Team`,
                html: `
                    <p>Hello ${accountExists.username || 'User'},</p>
                    <p>Your password reset code is: <strong>${resetCode}</strong></p>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <p>Thanks,<br>The XCE Team</p>
                `,
            };

            try {
                let info = await transporter.sendMail(mailOptions);
                console.warn(`Password reset email sent to ${emailToReset}. Message ID: ${info.messageId}`);
            } catch (emailError) {
                console.error(`Error sending password reset email to ${emailToReset}:`, emailError);
            }

        } else {
            console.warn(`ℹNo account found for email: ${emailToReset}. Still returning generic success message to prevent enumeration.`);
        }

        return res.status(200).json({ message: 'If an account with that email address exists, instructions to reset your password have been sent.' });

    } catch (err) {
        console.error('Error during password reset request processing:', err.message, err);
        if (err.command && err.command.includes('redis')) {
            console.error('Specific Redis error during password reset:', err);
            return res.status(500).json({ error: 'A database error occurred while processing your request for password reset.' });
        }
        return res.status(500).json({ error: 'An internal server error occurred while processing your request.' });
    }
}