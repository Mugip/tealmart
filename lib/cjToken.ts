import fs from "fs"
import path from "path"

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const CJ_API_KEY = process.env.CJ_API_KEY!

const TOKEN_CACHE_FILE = "/tmp/cj_token_cache.json"

type TokenCache = {
  access_token: string
  access_token_expiry_date: string
}

/* =========================
GET TOKEN
========================= */

export async function getCJToken(): Promise<string> {

  try {

    if (fs.existsSync(TOKEN_CACHE_FILE)) {

      const raw = fs.readFileSync(TOKEN_CACHE_FILE, "utf8")
      const cache: TokenCache = JSON.parse(raw)

      const expiry = new Date(cache.access_token_expiry_date).getTime()

      if (Date.now() < expiry) {

        console.log("🟢 CJ cached token used")

        return cache.access_token
      }
    }

  } catch (err) {
    console.log("⚠️ Token cache read error")
  }

  return fetchNewToken()
}

/* =========================
FETCH NEW TOKEN
========================= */

async function fetchNewToken(): Promise<string> {

  console.log("🔵 Fetching new CJ token")

  const res = await fetch(
    `${CJ_API_URL}/authentication/getAccessToken`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiKey: CJ_API_KEY
      })
    }
  )

  const data = await res.json()

  if (data.code !== 200) {

    throw new Error(
      "CJ auth failed: " + JSON.stringify(data)
    )
  }

  const token = data.data.accessToken
  const expiry = data.data.accessTokenExpiryDate

  const cache: TokenCache = {
    access_token: token,
    access_token_expiry_date: expiry
  }

  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache))
  } catch {
    console.log("⚠️ Token cache write failed")
  }

  return token
  }
