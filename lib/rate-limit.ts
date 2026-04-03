import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'agp'
      })
    : null;

export async function rateLimit(identifier: string, limit = 5, duration: Duration = '1 m') {
  if (!limiter) return { success: true, remaining: 999, reset: Date.now() + 60_000 };

  const custom = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, duration),
    analytics: true,
    prefix: 'agp'
  });

  return custom.limit(identifier);
}
