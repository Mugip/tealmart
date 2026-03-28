// lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis | undefined }

// Serverless-optimized Redis connection
export const redis =
  globalForRedis.redis ??
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1, // Don't queue commands if disconnected
        connectTimeout: 2000,    // Give up connecting after 2 seconds
        retryStrategy: () => null, // Do not endlessly retry on Vercel
        // If using Upstash or secure Redis, TLS is required
        tls: process.env.REDIS_URL.startsWith('rediss://') 
          ? { rejectUnauthorized: false } 
          : undefined
      })
    : undefined)

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

/**
 * Advanced caching layer: intercepts expensive DB queries.
 * Optimized for serverless: never hangs the page load.
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // If Redis is not configured or dropped, just run the database query normally
  if (!redis) {
    return fetcher()
  }

  try {
    // Timeout race condition: If Redis takes longer than 1.5 seconds, skip it
    const cached = await Promise.race([
      redis.get(key),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 1500)
      )
    ])

    if (cached) {
      return JSON.parse(cached as string)
    }

    // Cache miss: hit the database
    const data = await fetcher()
    
    // Fire-and-forget: set cache in the background so it doesn't slow down the user
    redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(() => {})
    
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    // Silently catch ECONNRESET or Timeouts and instantly fallback to Database
    console.warn(`[Redis Fast-Fail] Falling back to DB for ${key}`);
    return fetcher()
  }
}
