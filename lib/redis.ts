// lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis | undefined }

// Initialize Redis client if REDIS_URL exists
export const redis =
  globalForRedis.redis ??
  (process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : undefined)

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

/**
 * Advanced caching layer: intercepts expensive DB queries.
 * @param key The unique cache key (e.g., 'home:featured-products')
 * @param fetcher The database query to run if cache misses
 * @param ttlSeconds How long to keep the data in cache
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // If Redis is not configured, just run the database query normally
  if (!redis) {
    return fetcher()
  }

  try {
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }

    // Cache miss: hit the database
    const data = await fetcher()
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds)
    
    // Normalize data (ensures dates are stringified identically to cached versions)
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    console.error(`Redis cache error for key [${key}]:`, error)
    // Fallback to database if Redis drops connection
    return fetcher()
  }
}
