import fs from "fs"
import path from "path"

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const TOKEN_FILE = "/tmp/cj_token_cache.json"

type TokenCache = {
  token: string
  expiresAt: number
}

async function fetchNewToken(): Promise<TokenCache> {

  const res = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY
    })
  })

  const data = await res.json()

  if (data.code !== 200 || !data.data?.accessToken) {
    throw new Error("CJ auth failed: " + JSON.stringify(data))
  }

  const expiry = new Date(data.data.accessTokenExpiryDate).getTime()

  const tokenData: TokenCache = {
    token: data.data.accessToken,
    expiresAt: expiry
  }

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData))

  console.log("[CJ CACHE] New token cached until:", new Date(expiry))

  return tokenData
}

export async function getCJToken(): Promise<string> {

  try {

    if (fs.existsSync(TOKEN_FILE)) {

      const raw = fs.readFileSync(TOKEN_FILE, "utf8")
      const data: TokenCache = JSON.parse(raw)

      if (data.token && Date.now() < data.expiresAt - 60000) {

        console.log("[CJ CACHE] Using cached token")

        return data.token
      }

      console.log("[CJ CACHE] Token expired, fetching new one")
    }

  } catch (err) {

    console.log("[CJ CACHE] Cache corrupted, regenerating")
  }

  const newToken = await fetchNewToken()

  return newToken.token
        }
