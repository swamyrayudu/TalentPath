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

/**
 * Universal Queue-Based Cache with Limit (FIFO/LRU Eviction)
 */
export class LimitedQueueCache {
  private queueKey: string;
  private limit: number;

  constructor(queueKey: string, limit: number = 10) {
    this.queueKey = queueKey;
    this.limit = limit;
  }

  async get(key: string): Promise<unknown | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      if (data) {
        // Move key to front of queue (LRU behavior)
        await redis.lrem(this.queueKey, 0, key);
        await redis.lpush(this.queueKey, key);
        return data;
      }
    } catch (error) {
      console.error(`[Redis Queue Cache] Error getting key ${key}:`, error);
    }
    return null;
  }

  async set(key: string, data: unknown): Promise<void> {
    if (!redis) return;
    try {
      // 1. Set the data in Redis
      await redis.set(key, data);

      // 2. Move key to front of queue
      await redis.lrem(this.queueKey, 0, key);
      await redis.lpush(this.queueKey, key);

      // 3. Trim the list if limit is exceeded
      const len = await redis.llen(this.queueKey);
      if (len > this.limit) {
        const keysToEvictCount = len - this.limit;
        for (let i = 0; i < keysToEvictCount; i++) {
          const evictedKey = await redis.rpop(this.queueKey);
          if (evictedKey) {
            await redis.del(evictedKey);
            console.log(`[Redis Queue Cache] Evicted key: ${evictedKey}`);
          }
        }
      }
    } catch (error) {
      console.error(`[Redis Queue Cache] Error setting key ${key}:`, error);
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
      await redis.lrem(this.queueKey, 0, key);
      console.log(`[Redis Queue Cache] Invalidated key: ${key}`);
    } catch (error) {
      console.error(`[Redis Queue Cache] Error invalidating key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.lrange(this.queueKey, 0, -1);
      if (keys.length > 0) {
        // Filter out empty/null values
        const validKeys = keys.filter(Boolean);
        if (validKeys.length > 0) {
          await redis.del(...validKeys);
        }
      }
      await redis.del(this.queueKey);
      console.log(`[Redis Queue Cache] Cleared queue ${this.queueKey}`);
    } catch (error) {
      console.error(`[Redis Queue Cache] Error clearing queue ${this.queueKey}:`, error);
    }
  }
}

// Global pattern cache with a limit of 10
export const patternCache = new LimitedQueueCache('pattern_cache_keys', 10);

