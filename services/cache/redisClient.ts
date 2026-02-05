import Redis from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

let client: RedisType | null = null;

export function getRedisClient(): RedisType {
  if (!client) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    client = new Redis(url);
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
