// lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis | undefined }

// Auto-fix Upstash URLs to ensure they use TLS (rediss://)
let safeRedisUrl = process.env.REDIS_URL
if (safeRedisUrl && safeRedisUrl.includes('upstash.io') && safeRedisUrl.startsWith('redis://')) {
  safeRedisUrl = safeRedisUrl.replace('redis://', 'rediss://')
}

// Serverless-optimized Redis connection
export const redis =
  globalForRedis.redis ??
  (safeRedisUrl
    ? new Redis(safeRedisUrl, {
        family: 4,               // CRITICAL FIX: Forces IPv4 for Upstash on Vercel
        lazyConnect: true,       // Don't block the server boot process
        maxRetriesPerRequest: 1, // Don't queue commands if disconnected
        connectTimeout: 1000,    // Give up connecting after 1 second
        retryStrategy: () => null, // Do not endlessly retry on Vercel
      })
    : undefined)

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

let redisCircuitOpen = false;
let circuitOpenTime = 0;

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  if (!redis) return fetcher()

  if (redisCircuitOpen) {
    if (Date.now() - circuitOpenTime > 60000) {
      redisCircuitOpen = false;
    } else {
      return fetcher();
    }
  }

  try {
    const cached = await Promise.race([
      redis.get(key),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 400)
      )
    ])

    if (cached) return JSON.parse(cached as string)

    const data = await fetcher()
    redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(() => {})
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    console.warn(`[Redis Fast-Fail] Timeout for ${key}. Tripping circuit breaker.`);
    redisCircuitOpen = true;
    circuitOpenTime = Date.now();
    return fetcher()
  }
}
