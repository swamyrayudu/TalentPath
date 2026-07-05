import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize redis client if configuration is present
export const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

export const getDashboardCacheKey = (userId: string) => `dashboard:user:${userId}`;

export const DASHBOARD_CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Retrieve cached dashboard data for a user.
 * Falls back to null on cache miss or connection error.
 */
export async function getCachedDashboardData(userId: string): Promise<unknown | null> {
  if (!redis) {
    console.warn('[Redis Cache] Upstash Redis is not configured. Caching is disabled.');
    return null;
  }
  try {
    const key = getDashboardCacheKey(userId);
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Redis Cache] Hit for user: ${userId}`);
      return cached;
    }
    console.log(`[Redis Cache] Miss for user: ${userId}`);
  } catch (error) {
    console.error(`[Redis Cache] Error reading cache for user ${userId}:`, error);
  }
  return null;
}

/**
 * Cache dashboard data for a user with TTL.
 * Fails gracefully without throwing on connection error.
 */
export async function setCachedDashboardData(userId: string, data: unknown): Promise<void> {
  if (!redis) return;
  try {
    const key = getDashboardCacheKey(userId);
    await redis.set(key, data, { ex: DASHBOARD_CACHE_TTL });
    console.log(`[Redis Cache] Saved cache for user: ${userId} with TTL: ${DASHBOARD_CACHE_TTL}s`);
  } catch (error) {
    console.error(`[Redis Cache] Error setting cache for user ${userId}:`, error);
  }
}

/**
 * Invalidate cached dashboard data for a user.
 * Fails gracefully without throwing on connection error.
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  if (!redis) return;
  try {
    const key = getDashboardCacheKey(userId);
    await redis.del(key);
    console.log(`[Redis Cache] Invalidated cache for user: ${userId}`);
  } catch (error) {
    console.error(`[Redis Cache] Error invalidating cache for user ${userId}:`, error);
  }
}
