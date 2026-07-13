import { Redis } from '@upstash/redis';

const redisUrl1 = process.env.UPSTASH_REDIS_REST_URL1;
const redisToken1 = process.env.UPSTASH_REDIS_REST_TOKEN1;

// Initialize cacheRedis client if configuration is present
export const cacheRedis = redisUrl1 && redisToken1
  ? new Redis({ url: redisUrl1, token: redisToken1 })
  : null;

export const getDashboardCacheKey = (userId: string) => `dashboard:user:${userId}`;

export const DASHBOARD_CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Retrieve cached dashboard data for a user.
 * Falls back to null on cache miss or connection error.
 */
export async function getCachedDashboardData(userId: string): Promise<unknown | null> {
  if (!cacheRedis) {
    console.warn('[Redis Cache] Upstash Redis cache is not configured. Caching is disabled.');
    return null;
  }
  try {
    const key = getDashboardCacheKey(userId);
    const cached = await cacheRedis.get(key);
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
  if (!cacheRedis) return;
  try {
    const key = getDashboardCacheKey(userId);
    await cacheRedis.set(key, data, { ex: DASHBOARD_CACHE_TTL });
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
  if (!cacheRedis) return;
  try {
    const key = getDashboardCacheKey(userId);
    await cacheRedis.del(key);
    console.log(`[Redis Cache] Invalidated cache for user: ${userId}`);
  } catch (error) {
    console.error(`[Redis Cache] Error invalidating cache for user ${userId}:`, error);
  }
}

/**
 * Retrieve cached data for a generic key.
 * Falls back to null on cache miss or connection error.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!cacheRedis) return null;
  try {
    const cached = await cacheRedis.get(key);
    if (cached) {
      return cached as T;
    }
  } catch (error) {
    console.error(`[Redis Cache] Error reading cache for key ${key}:`, error);
  }
  return null;
}

/**
 * Cache generic data with TTL.
 * Fails gracefully without throwing on connection error.
 */
export async function setCachedData(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  if (!cacheRedis) return;
  try {
    await cacheRedis.set(key, data, { ex: ttlSeconds });
    console.log(`[Redis Cache] Saved cache for key: ${key} with TTL: ${ttlSeconds}s`);
  } catch (error) {
    console.error(`[Redis Cache] Error setting cache for key ${key}:`, error);
  }
}

/**
 * Invalidate cached data for a generic key.
 * Fails gracefully without throwing on connection error.
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  if (!cacheRedis) return;
  try {
    await cacheRedis.del(key);
    console.log(`[Redis Cache] Invalidated cache key: ${key}`);
  } catch (error) {
    console.error(`[Redis Cache] Error invalidating cache key ${key}:`, error);
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
    if (!cacheRedis) return null;
    try {
      const data = await cacheRedis.get(key);
      if (data) {
        // Move key to front of queue (LRU behavior)
        await cacheRedis.lrem(this.queueKey, 0, key);
        await cacheRedis.lpush(this.queueKey, key);
        return data;
      }
    } catch (error) {
      console.error(`[Redis Queue Cache] Error getting key ${key}:`, error);
    }
    return null;
  }

  async set(key: string, data: unknown): Promise<void> {
    if (!cacheRedis) return;
    try {
      // 1. Set the data in Redis
      await cacheRedis.set(key, data);

      // 2. Move key to front of queue
      await cacheRedis.lrem(this.queueKey, 0, key);
      await cacheRedis.lpush(this.queueKey, key);

      // 3. Trim the list if limit is exceeded
      const len = await cacheRedis.llen(this.queueKey);
      if (len > this.limit) {
        const keysToEvictCount = len - this.limit;
        for (let i = 0; i < keysToEvictCount; i++) {
          const evictedKey = await cacheRedis.rpop(this.queueKey);
          if (evictedKey) {
            await cacheRedis.del(evictedKey);
            console.log(`[Redis Queue Cache] Evicted key: ${evictedKey}`);
          }
        }
      }
    } catch (error) {
      console.error(`[Redis Queue Cache] Error setting key ${key}:`, error);
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!cacheRedis) return;
    try {
      await cacheRedis.del(key);
      await cacheRedis.lrem(this.queueKey, 0, key);
      console.log(`[Redis Queue Cache] Invalidated key: ${key}`);
    } catch (error) {
      console.error(`[Redis Queue Cache] Error invalidating key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!cacheRedis) return;
    try {
      const keys = await cacheRedis.lrange(this.queueKey, 0, -1);
      if (keys.length > 0) {
        // Filter out empty/null values
        const validKeys = keys.filter(Boolean);
        if (validKeys.length > 0) {
          await cacheRedis.del(...validKeys);
        }
      }
      await cacheRedis.del(this.queueKey);
      console.log(`[Redis Queue Cache] Cleared queue ${this.queueKey}`);
    } catch (error) {
      console.error(`[Redis Queue Cache] Error clearing queue ${this.queueKey}:`, error);
    }
  }
}

// Global pattern cache with a limit of 10
export const patternCache = new LimitedQueueCache('pattern_cache_keys', 10);
