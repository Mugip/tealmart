// lib/cjToken.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const CJ_API_KEY = process.env.CJ_API_KEY!

let memoryCache: {
  accessToken: string
  refreshToken: string
  accessExpiry: Date
  refreshExpiry: Date
} | null = null

export async function getCJToken(): Promise<string> {
  const now = new Date()

  // 1. Check memory cache (fastest)
  if (memoryCache && now < memoryCache.accessExpiry) {
    console.log("✅ Memory cache hit")
    return memoryCache.accessToken
  }

  // 2. Check database cache
  try {
    const cached = await prisma.cJTokenCache.findUnique({
      where: { key: "access_token" }
    })

    if (cached && now < cached.expiresAt) {
      console.log("✅ DB cache hit")
      
      // Also get refresh token
      const refreshCache = await prisma.cJTokenCache.findUnique({
        where: { key: "refresh_token" }
      })

      if (refreshCache) {
        memoryCache = {
          accessToken: cached.value,
          refreshToken: refreshCache.value,
          accessExpiry: cached.expiresAt,
          refreshExpiry: refreshCache.expiresAt
        }
      }

      return cached.value
    }
  } catch (e) {
    console.log("⚠️ DB cache failed:", e)
  }

  // 3. Try to refresh
  if (memoryCache && now < memoryCache.refreshExpiry) {
    console.log("🔄 Attempting refresh...")
    try {
      const refreshed = await refreshAccessToken(memoryCache.refreshToken)
      if (refreshed) return refreshed
    } catch (e) {
      console.log("⚠️ Refresh failed:", e)
    }
  }

  // 4. Get new token
  console.log("🔑 Fetching new token")
  return await fetchNewToken()
}

async function fetchNewToken(): Promise<string> {
  const res = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: CJ_API_KEY })
  })

  const data = await res.json()

  if (data.code !== 200 || !data.data?.accessToken) {
    throw new Error("CJ auth failed: " + JSON.stringify(data))
  }

  const accessExpiry = new Date(data.data.accessTokenExpiryDate)
  const refreshExpiry = new Date(data.data.refreshTokenExpiryDate)

  // Save to memory
  memoryCache = {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    accessExpiry,
    refreshExpiry
  }

  // Save to database
  await prisma.cJTokenCache.upsert({
    where: { key: "access_token" },
    update: { value: data.data.accessToken, expiresAt: accessExpiry },
    create: { key: "access_token", value: data.data.accessToken, expiresAt: accessExpiry }
  })

  await prisma.cJTokenCache.upsert({
    where: { key: "refresh_token" },
    update: { value: data.data.refreshToken, expiresAt: refreshExpiry },
    create: { key: "refresh_token", value: data.data.refreshToken, expiresAt: refreshExpiry }
  })

  console.log(`✅ New token cached until ${accessExpiry.toISOString()}`)
  return data.data.accessToken
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(`${CJ_API_URL}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  })

  const data = await res.json()

  if (data.code !== 200 || !data.data?.accessToken) {
    return null
  }

  const accessExpiry = new Date(data.data.accessTokenExpiryDate)
  const refreshExpiry = new Date(data.data.refreshTokenExpiryDate)

  memoryCache = {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    accessExpiry,
    refreshExpiry
  }

  await prisma.cJTokenCache.upsert({
    where: { key: "access_token" },
    update: { value: data.data.accessToken, expiresAt: accessExpiry },
    create: { key: "access_token", value: data.data.accessToken, expiresAt: accessExpiry }
  })

  await prisma.cJTokenCache.upsert({
    where: { key: "refresh_token" },
    update: { value: data.data.refreshToken, expiresAt: refreshExpiry },
    create: { key: "refresh_token", value: data.data.refreshToken, expiresAt: refreshExpiry }
  })

  console.log("✅ Token refreshed")
  return data.data.accessToken
}
