import fs from "fs"
import path from "path"

const CJ_API_KEY = process.env.CJ_API_KEY!
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

const CACHE_FILE = "/tmp/cj_token_cache.json"

async function fetchNewToken() {

  const res = await fetch(
    `${CJ_API_URL}/authentication/getAccessToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: CJ_API_KEY })
    }
  )

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error("CJ auth failed: " + JSON.stringify(data))
  }

  const expiry = new Date(data.data.accessTokenExpiryDate).getTime()

  const cache = {
    access_token: data.data.accessToken,
    expiry
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache))

  return cache.access_token
}

export async function getCJToken() {

  try {

    if (fs.existsSync(CACHE_FILE)) {

      const raw = fs.readFileSync(CACHE_FILE, "utf8")
      const cache = JSON.parse(raw)

      if (Date.now() < cache.expiry) {
        return cache.access_token
      }
    }

  } catch {}

  return fetchNewToken()
}
