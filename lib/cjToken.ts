// lib/cjToken.ts
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const CJ_API_KEY = process.env.CJ_API_KEY!

interface TokenCache {
  accessToken: string
  refreshToken: string
  accessExpiry: number
  refreshExpiry: number
}

// In-memory cache (survives within same Lambda execution)
let memoryCache: TokenCache | null = null

export async function getCJToken(): Promise<string> {
  const now = Date.now()

  // Check memory cache first
  if (memoryCache && now < memoryCache.accessExpiry) {
    console.log("✅ Using cached access token")
    return memoryCache.accessToken
  }

  // Try to refresh if we have a valid refresh token
  if (memoryCache && now < memoryCache.refreshExpiry) {
    console.log("🔄 Refreshing access token...")
    try {
      const refreshed = await refreshAccessToken(memoryCache.refreshToken)
      if (refreshed) return refreshed
    } catch (e) {
      console.log("⚠️ Refresh failed, getting new token")
    }
  }

  // Get new token
  console.log("🔑 Getting new access token...")
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

  const accessExpiry = new Date(data.data.accessTokenExpiryDate).getTime()
  const refreshExpiry = new Date(data.data.refreshTokenExpiryDate).getTime()

  memoryCache = {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    accessExpiry,
    refreshExpiry
  }

  return data.data.accessToken
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${CJ_API_URL}/authentication/refreshAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    })

    const data = await res.json()

    if (data.code !== 200 || !data.data?.accessToken) {
      return null
    }

    const accessExpiry = new Date(data.data.accessTokenExpiryDate).getTime()
    const refreshExpiry = new Date(data.data.refreshTokenExpiryDate).getTime()

    memoryCache = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      accessExpiry,
      refreshExpiry
    }

    return data.data.accessToken
  } catch {
    return null
  }
    }
