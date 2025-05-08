import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function readAccounts() {
    const raw = await redis.get('accounts');
    return raw ? JSON.parse(raw) : [];
}


export async function writeAccounts(accounts) {
    await redis.set('accounts', JSON.stringify(accounts));
}
