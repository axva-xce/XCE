// /api/db.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function readAccounts() {
    const raw = await redis.get('accounts');
    if (!raw) {
        // key missing or null → start with empty array
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        // if it’s not an array, throw to fall into the catch
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        return parsed;
    } catch (err) {
        console.warn('⚠️ readAccounts: invalid data, resetting to []', err.message);
        return [];
    }
}

export async function writeAccounts(accounts) {
    // always overwrite with a JSON array string
    await redis.set('accounts', JSON.stringify(accounts));
}
