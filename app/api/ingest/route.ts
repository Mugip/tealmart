import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const CJ_API_KEY = process.env.CJ_API_KEY!
const INGEST_API_KEY = process.env.INGESTION_API_KEY!

/* ======================================================
TOKEN CACHE
====================================================== */

let cachedToken: string | null = null
let tokenExpiry = 0

async function fetchNewToken() {
  const res = await fetch(`${CJ_API_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  })

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error("CJ auth failed: " + JSON.stringify(data))
  }

  cachedToken = data.data.accessToken
  tokenExpiry = new Date(data.data.accessTokenExpiryDate).getTime()

  console.log("🔑 New CJ token cached")

  return cachedToken!
}

async function getCJAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && now < tokenExpiry - 60000) {
    return cachedToken
  }

  return fetchNewToken()
}

/* ======================================================
MARKUP
====================================================== */

function applyMarkup(cost: number) {
  if (!cost || cost <= 0) return 0

  if (cost < 5) return +(cost * 3).toFixed(2)
  if (cost < 15) return +(cost * 2.2).toFixed(2)
  if (cost < 50) return +(cost * 1.8).toFixed(2)

  return +(cost * 1.5).toFixed(2)
}

/* ======================================================
FETCH PRODUCT LIST
====================================================== */

async function fetchCJProducts(keyword?: string, count = 10) {
  const token = await getCJAccessToken()

  const size = Math.min(count, 10)

  const params = new URLSearchParams({
    page: "1",
    size: size.toString(),
  })

  if (keyword) params.append("keyWord", keyword)

  const res = await fetch(
    `${CJ_API_URL}/product/listV2?${params.toString()}`,
    { headers: { "CJ-Access-Token": token } }
  )

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error("CJ product fetch failed: " + JSON.stringify(data))
  }

  return data.data?.content?.[0]?.productList ?? []
}

/* ======================================================
FETCH PRODUCT DETAIL
====================================================== */

async function fetchProductDetail(pid: string) {
  const token = await getCJAccessToken()

  const res = await fetch(
    `${CJ_API_URL}/product/query?pid=${pid}`,
    { headers: { "CJ-Access-Token": token } }
  )

  const data = await res.json()

  if (data.code !== 200) {
    console.log("❌ CJ detail error", data)
    return null
  }

  return data.data
}

/* ======================================================
IMAGE PARSER
====================================================== */

function parsePossibleJSON(value: any): string[] {
  if (!value) return []

  if (Array.isArray(value)) return value

  if (typeof value === "string") {
    const v = value.trim()

    if (v.startsWith("[")) {
      try {
        const parsed = JSON.parse(v)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return []
      }
    }

    return [v]
  }

  return []
}

function extractImages(detail: any): string[] {
  let images: string[] = []

  images.push(...parsePossibleJSON(detail.productImage))
  images.push(...parsePossibleJSON(detail.productImageList))

  const cleaned = images.filter(
    (img) => typeof img === "string" && img.startsWith("http")
  )

  return [...new Set(cleaned)]
}

/* ======================================================
VARIANT EXTRACTION
====================================================== */

function extractVariants(detail: any) {
  const raw = detail.variants

  if (!raw) return { variants: [], options: [] }

  let variantsRaw = raw

  if (typeof raw === "string") {
    try {
      variantsRaw = JSON.parse(raw)
    } catch {
      return { variants: [], options: [] }
    }
  }

  if (!Array.isArray(variantsRaw)) {
    return { variants: [], options: [] }
  }

  const variants: any[] = []
  const optionGroups: Record<string, Set<string>> = {}

  for (const v of variantsRaw) {
    const key = v.variantKey || ""
    const parts = key.split("-")

    const structured: any = {}

    if (parts[0]) {
      structured.Color = parts[0]
      optionGroups.Color ??= new Set()
      optionGroups.Color.add(parts[0])
    }

    if (parts[1]) {
      structured.Size = parts[1]
      optionGroups.Size ??= new Set()
      optionGroups.Size.add(parts[1])
    }

    const price = applyMarkup(
      Number(v.variantSellPrice || v.sellPrice || 0)
    )

    variants.push({
      externalId: v.vid,
      price,
      stock: v.variantStock || 0,
      image: v.variantImage,
      options: structured,
    })
  }

  const options = Object.entries(optionGroups).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }))

  return { variants, options }
}

/* ======================================================
SAVE PRODUCT
====================================================== */

async function saveProduct(detail: any) {
  const pid = detail.pid
  if (!pid) return

  const images = extractImages(detail)
  const { variants, options } = extractVariants(detail)

  let basePrice = Number(detail.sellPrice || 0)

  if (variants.length > 0) {
    const prices = variants.map((v) => v.price)
    basePrice = Math.min(...prices)
  }

  basePrice = applyMarkup(basePrice)

  console.log("💾 Saving:", detail.productNameEn)
  console.log("🖼 Images:", images.length)
  console.log("📦 Variants:", variants.length)

  await prisma.product.upsert({
    where: { externalId: pid },

    create: {
      externalId: pid,
      title: detail.productNameEn || "Untitled",
      description: detail.description || "",
      price: basePrice,
      images,
      category: detail.categoryName || "general",
      variants,
      options,
      source: "CJ",
    },

    update: {
      title: detail.productNameEn || "Untitled",
      description: detail.description || "",
      price: basePrice,
      images,
      category: detail.categoryName || "general",
      variants,
      options,
      source: "CJ",
    },
  })
}

/* ======================================================
API ROUTE
====================================================== */

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key")

    if (!INGEST_API_KEY || apiKey !== INGEST_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const count = body.count || 5
    const keyword = body.keyword

    const baseProducts = await fetchCJProducts(keyword, count)

    let saved = 0

    for (const p of baseProducts) {
      const detail = await fetchProductDetail(p.id)

      if (!detail) continue

      await saveProduct(detail)

      saved++

      await new Promise((r) => setTimeout(r, 1100))
    }

    return NextResponse.json({
      success: true,
      saved,
    })
  } catch (err: any) {
    console.error(err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
      }
