import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function readAccounts() {
    // DEBUG: log the Upstash config
    console.warn('🔧 UPSTASH URL:', process.env.UPSTASH_REDIS_REST_URL);
    console.warn('🔧 UPSTASH TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? '***set***' : '***missing***');

    let raw;
    try {
        raw = await redis.get('accounts');
        console.warn('🔧 raw accounts key:', raw);
    } catch (err) {
        console.error('❌ Error fetching raw accounts key:', err);
        throw err;
    }

    if (!raw) {
        console.warn('⚠️ accounts key is empty or missing; initializing []');
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        return parsed;
    } catch (err) {
        console.warn('⚠️ readAccounts: invalid JSON or not an array:', err.message);
        return [];
    }
}

export async function writeAccounts(accounts) {
    console.warn('🔧 writeAccounts will write:', JSON.stringify(accounts));
    await redis.set('accounts', JSON.stringify(accounts));
}
