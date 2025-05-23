import { readAccounts } from './db'; // Path to your db.js
import nodemailer from 'nodemailer';
import { Redis } from '@upstash/redis';

// --- BEGIN SENSITIVE ENV VAR CHECK & EARLY LOGGING ---
console.log('[request-password-reset.js] Module loading...');

let redisClientForCodes;
let essentialEnvVarsOk = true;

if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.error('[request-password-reset.js] FATAL ERROR: UPSTASH_REDIS_REST_URL environment variable is not set.');
    essentialEnvVarsOk = false;
}
if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('[request-password-reset.js] FATAL ERROR: UPSTASH_REDIS_REST_TOKEN environment variable is not set.');
    essentialEnvVarsOk = false;
}
if (!process.env.EMAIL_USER) {
    console.error('[request-password-reset.js] FATAL ERROR: EMAIL_USER environment variable is not set.');
    essentialEnvVarsOk = false;
}
if (!process.env.EMAIL_PASS) {
    console.error('[request-password-reset.js] FATAL ERROR: EMAIL_PASS environment variable is not set.');
    essentialEnvVarsOk = false;
}

if (essentialEnvVarsOk) {
    try {
        redisClientForCodes = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        console.log('[request-password-reset.js] Redis client for codes initialized.');
    } catch (e) {
        console.error('[request-password-reset.js] FATAL ERROR: Could not initialize Redis client for codes.', e);
        essentialEnvVarsOk = false; // Mark as not OK if Redis init fails
    }
} else {
    console.error('[request-password-reset.js] Skipping Redis client initialization due to missing essential environment variables.');
}
console.log(`[request-password-reset.js] Essential Env Vars OK: ${essentialEnvVarsOk}`);
// --- END SENSITIVE ENV VAR CHECK & EARLY LOGGING ---


export const config = {
    api: {
        bodyParser: true,
    },
};

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
    // Log the very first line of handler execution
    console.log(`[Handler] /api/request-password-reset ${req.method} invoked. Request ID: ${req.headers['x-vercel-id'] || 'N/A'}`);

    // If essential environment variables were missing at module load, the function cannot operate.
    if (!essentialEnvVarsOk || !redisClientForCodes) {
        console.error(`[Handler] Cannot process request. Essential setup failed. essentialEnvVarsOk: ${essentialEnvVarsOk}, redisClientForCodes initialized: ${!!redisClientForCodes}`);
        // It's possible redisClientForCodes is undefined if new Redis() threw an error too.
        return res.status(500).json({ error: 'Server configuration error. Service unavailable.' });
    }

    if (req.method === 'GET') {
        console.log("[Handler] GET request received. Responding with 405.");
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    if (req.method !== 'POST') {
        console.log(`[Handler] Unsupported method ${req.method}. Responding with 405.`);
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let emailToReset;
    try {
        const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        emailToReset = requestBody.email;

        if (!emailToReset || typeof emailToReset !== 'string') {
            console.warn('[Handler] Missing or invalid email in request body:', req.body);
            return res.status(400).json({ error: 'Email is required and must be a string' });
        }
    } catch (err) {
        console.error('[Handler] Invalid JSON in request body for password reset', err);
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.warn(`[Handler] Password reset requested for email: ${emailToReset}`);

    try {
        const accounts = await readAccounts(); // db.js also uses UPSTASH env vars
        const accountExists = accounts.find(acc => acc.email === emailToReset);

        if (accountExists) {
            console.warn(`[Handler] Account found for email: ${emailToReset} (user: ${accountExists.username}). Initiating password reset code generation.`);

            const resetCode = generateResetCode();
            const redisKey = `password_reset_code:${emailToReset}`;
            const expirySeconds = 15 * 60; // Code valid for 15 minutes

            await redisClientForCodes.set(redisKey, resetCode, { ex: expirySeconds });
            console.warn(`[Handler] Reset code ${resetCode} stored in Redis for ${emailToReset} with key ${redisKey}, expires in ${expirySeconds}s.`);

            const transporter = nodemailer.createTransport({
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER, // Already checked at module load
                    pass: process.env.EMAIL_PASS, // Already checked at module load
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
                console.warn(`[Handler] Password reset email sent to ${emailToReset}. Message ID: ${info.messageId}`);
            } catch (emailError) {
                console.error(`[Handler] Error sending password reset email to ${emailToReset}:`, emailError);
                // Log the error, but still return generic success to client
            }

        } else {
            console.warn(`[Handler] No account found for email: ${emailToReset}. Still returning generic success message to prevent enumeration.`);
        }

        console.log("[Handler] Processing complete. Returning generic success message.");
        return res.status(200).json({ message: 'If an account with that email address exists, instructions to reset your password have been sent.' });

    } catch (err) {
        console.error('[Handler] Error during password reset request processing:', err.message, err);
        // Check if the error object has properties that indicate it's from Upstash/Redis
        const isRedisError = err.name === 'RedisError' || (err.message && err.message.toLowerCase().includes('redis')) || (err.command && typeof err.command.includes === 'function' && err.command.includes('redis'));
        if (isRedisError) {
            console.error('[Handler] Specific Redis error during password reset:', err);
            return res.status(500).json({ error: 'A database error occurred while processing your request for password reset.' });
        }
        return res.status(500).json({ error: 'An internal server error occurred while processing your request.' });
    }
}

console.log('[request-password-reset.js] Module finished loading.');