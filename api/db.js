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
            console.warn('accounts key wrong type—deleting and starting fresh');
            await redis.del('accounts');
            return [];
        }
        throw err;
    }

    if (raw === null) return [];
    if (typeof raw === 'object' && Array.isArray(raw)) {
        return raw;
    }

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            console.warn('readAccounts: JSON parsed but not an array, starting fresh');
            return [];
        } catch (err) {
            console.warn('readAccounts: invalid JSON, starting fresh:', err.message);
            return [];
        }
    }

    console.warn('readAccounts: unexpected raw type, starting fresh');
    return [];
}

export async function writeAccounts(accounts) {
    await redis.set('accounts', JSON.stringify(accounts));
}