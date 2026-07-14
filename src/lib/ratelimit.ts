import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Use the second Redis instance for rate limiting (keeps it separate from cache)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL2!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN2!,
});

/**
 * Compiler Rate Limiter
 * 
 * Limits each user to 5 compile requests per 10-second sliding window.
 * Uses Upstash Redis with sliding window algorithm for accurate rate limiting.
 * 
 * When the limit is exceeded, the API returns a 429 (Too Many Requests) response.
 * The window resets automatically after 10 seconds of inactivity.
 */
export const compilerRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '30 s'),
  analytics: true,
  prefix: 'ratelimit:compiler',
});
