// lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis | undefined }

// Serverless-optimized Redis connection
export const redis =
  globalForRedis.redis ??
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1, // Don't queue commands if disconnected
        connectTimeout: 1000,    // Give up connecting after 1 second
        retryStrategy: () => null, // Do not endlessly retry on Vercel
        tls: process.env.REDIS_URL.startsWith('rediss://') 
          ? { rejectUnauthorized: false } 
          : undefined
      })
    : undefined)

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

// Circuit Breaker State (Persists across warm serverless invocations)
let redisCircuitOpen = false;
let circuitOpenTime = 0;

/**
 * Advanced caching layer: intercepts expensive DB queries.
 * Optimized for serverless: never hangs the page load.
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

  // If circuit is open (Redis recently failed), wait 60 seconds before trying again
  if (redisCircuitOpen) {
    if (Date.now() - circuitOpenTime > 60000) {
      redisCircuitOpen = false; // Try closing circuit after 60s
    } else {
      return fetcher(); // Skip Redis instantly without waiting
    }
  }

  try {
    // Timeout race condition: If Redis takes longer than 400ms, skip it!
    const cached = await Promise.race([
      redis.get(key),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 400)
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
    // Catch ECONNRESET or Timeouts, trip the circuit breaker, and instantly fallback to Database
    console.warn(`[Redis Fast-Fail] Timeout or connection error for ${key}. Tripping circuit breaker for 60s.`);
    redisCircuitOpen = true;
    circuitOpenTime = Date.now();
    return fetcher()
  }
}
