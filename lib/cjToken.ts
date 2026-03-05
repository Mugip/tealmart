import fs from "fs"
import path from "path"

const CACHE_FILE = path.join("/tmp", "cj_token_cache.json")
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const CJ_API_KEY = process.env.CJ_API_KEY!

interface Cache {
  token: string
  expires: number
}

function loadCache(): Cache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null
    const raw = fs.readFileSync(CACHE_FILE, "utf-8")
    const data = JSON.parse(raw)
    if (Date.now() < data.expires) return data
  } catch {}
  return null
}

function saveCache(token: string, expires: number) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ token, expires }))
  } catch {}
}

export async function getCJToken(): Promise<string> {

  const cached = loadCache()
  if (cached) return cached.token

  const res = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: CJ_API_KEY })
  })

  const data = await res.json()

  if (data.code !== 200 || !data.data?.accessToken) {
    throw new Error("CJ auth failed: " + JSON.stringify(data))
  }

  const token = data.data.accessToken
  const expires = new Date(data.data.accessTokenExpiryDate).getTime()

  saveCache(token, expires)

  return token
    }
