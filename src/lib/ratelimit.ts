import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL2;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN2;

/**
 * Compiler Rate Limiter
 * 
 * Limits each user to 5 compile requests per 30-second sliding window.
 * Uses Upstash Redis with sliding window algorithm for accurate rate limiting.
 * 
 * When the limit is exceeded, the API returns a 429 (Too Many Requests) response.
 * The window resets automatically after 30 seconds.
 * 
 * Returns null if Redis env vars are not configured (rate limiting disabled).
 */
export const compilerRateLimiter = redisUrl && redisToken
  ? new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.slidingWindow(5, '30 s'),
      analytics: true,
      prefix: 'ratelimit:compiler',
    })
  : null;
