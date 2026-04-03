import { redis } from './redis';

const keys = {
  overview: 'analytics:overview',
  stages: 'analytics:stages',
  categories: 'analytics:categories'
};

export async function getCacheJSON<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  return (await redis.get(key)) as T | null;
}

export async function setCacheJSON(key: string, value: unknown, ttlSeconds = 60) {
  if (!redis) return;
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function invalidateAnalyticsCache() {
  if (!redis) return;
  await Promise.all(Object.values(keys).map((key) => redis.del(key)));
}

export { keys as cacheKeys };
