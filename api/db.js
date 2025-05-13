// api/db.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function readAccounts() {
    let raw;
    try {
        raw = await redis.get('accounts');
    } catch (err) {
        if (err.message.includes('WRONGTYPE')) {
            console.warn('⚠️ accounts key wrong type—deleting and starting fresh');
            await redis.del('accounts');
            return [];
        }
        throw err;
    }

    // No key yet
    if (raw === null) return [];

    // If Upstash already gave us a JS object/array, just return it
    if (typeof raw === 'object' && Array.isArray(raw)) {
        return raw;
    }

    // Otherwise raw should be a string—try to parse
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            console.warn('⚠️ readAccounts: JSON parsed but not an array, starting fresh');
            return [];
        } catch (err) {
            console.warn('⚠️ readAccounts: invalid JSON, starting fresh:', err.message);
            return [];
        }
    }

    // Anything else, start fresh
    console.warn('⚠️ readAccounts: unexpected raw type, starting fresh');
    return [];
}

export async function writeAccounts(accounts) {
    // Always write as JSON text
    await redis.set('accounts', JSON.stringify(accounts));
}
