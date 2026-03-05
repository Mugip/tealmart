// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

// Category mapping for smart categorization
const CATEGORY_MAP: Record<string, string> = {
  "phone": "phone",
  "mobile": "phone",
  "smartphone": "phone",
  "shoes": "shoes",
  "footwear": "shoes",
  "sneakers": "shoes",
  "boots": "shoes",
  "bag": "bags",
  "backpack": "bags",
  "handbag": "bags",
  "watch": "watches",
  "timepiece": "watches",
  "jewelry": "jewelry",
  "necklace": "jewelry",
  "earring": "jewelry",
  "electronics": "electronics",
  "gadget": "electronics",
  "computer": "computer",
  "laptop": "computer",
  "tablet": "computer",
  "headphone": "audio",
  "earbuds": "audio",
  "speaker": "audio",
  "camera": "camera",
  "home": "home-garden",
  "garden": "home-garden",
  "kitchen": "kitchen",
  "beauty": "beauty",
  "cosmetic": "beauty",
  "makeup": "beauty",
  "toy": "toys",
  "kids": "toys",
  "baby": "baby",
  "fitness": "fitness",
  "sports": "sports",
  "pet": "pets"
}

function mapCategory(cjCategory?: string, keyword?: string): string {
  const search = `${cjCategory || ""} ${keyword || ""}`.toLowerCase()
  
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (search.includes(key)) return value
  }
  
  return "general"
}

function applyMarkup(cost: number): number {
  if (!cost || cost <= 0) return 0
  if (cost < 5) return +(cost * 3 - 0.01).toFixed(2)
  if (cost < 15) return +(cost * 2.2 - 0.01).toFixed(2)
  if (cost < 50) return +(cost * 1.8 - 0.01).toFixed(2)
  return +(cost * 1.5 - 0.01).toFixed(2)
}

async function fetchCJProducts(keyword?: string, count = 10) {
  const token = await getCJToken()

  let page = 1
  let remaining = count
  const products: any[] = []

  while (remaining > 0 && page <= 5) {
    const size = Math.min(remaining, 20)

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(size)
    })

    if (keyword) params.append("keyWord", keyword)

    const res = await fetch(
      `${CJ_API_URL}/product/listV2?${params.toString()}`,
      { headers: { "CJ-Access-Token": token } }
    )

    const data = await res.json()
    
    if (data.code !== 200) {
      throw new Error(`CJ API error: ${JSON.stringify(data)}`)
    }

    const content = data?.data?.content
    if (!content || content.length === 0) break

    const list = content[0]?.productList || []
    if (!list.length) break

    products.push(...list)
    remaining -= list.length
    page++
  }

  return products.slice(0, count)
}

async function fetchProductDetail(pid: string) {
  const token = await getCJToken()

  const res = await fetch(
    `${CJ_API_URL}/product/query?pid=${pid}`,
    { headers: { "CJ-Access-Token": token } }
  )

  const data = await res.json()
  if (data.code !== 200) return null
  return data.data
}

function parsePrice(value: any): number {
  if (!value) return 0
  if (typeof value === "number") return value
  
  const str = String(value).replace(/[^0-9.]/g, "")
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

function extractImages(product: any, detail?: any): string[] {
  const images: string[] = []
  
  // From detail
  if (detail?.productImage) images.push(detail.productImage)
  if (detail?.productImageList) {
    const imgList = Array.isArray(detail.productImageList) 
      ? detail.productImageList 
      : []
    images.push(...imgList)
  }
  
  // From product list
  if (product?.bigImage) images.push(product.bigImage)
  if (product?.productImageList) {
    const imgList = Array.isArray(product.productImageList) 
      ? product.productImageList 
      : []
    images.push(...imgList)
  }
  
  return images
    .filter((img) => typeof img === "string" && img.startsWith("http"))
    .slice(0, 5)
}

function extractVariants(detail: any) {
  if (!detail?.variants) return { variants: [], totalStock: 0 }

  let raw = detail.variants
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: [], totalStock: 0 }
    }
  }
  
  if (!Array.isArray(raw)) return { variants: [], totalStock: 0 }

  const variants: any[] = []
  let totalStock = 0

  for (const v of raw) {
    const sellPrice = parsePrice(v.variantSellPrice || v.sellPrice || 0)
    if (sellPrice <= 0) continue

    const costPrice = sellPrice * 0.7
    const price = applyMarkup(costPrice)

    const stock = Number(v.variantStock || 0)
    totalStock += stock

    // Parse variant options from variantKey (format: "Color-Red;Size-M")
    const options: Record<string, string> = {}
    if (v.variantKey) {
      const parts = v.variantKey.split(";")
      for (const part of parts) {
        const [name, value] = part.split("-")
        if (name && value) {
          options[name] = value
        }
      }
    }

    variants.push({
      id: v.vid,
      sku: v.variantSku || v.vid,
      price,
      costPrice,
      stock,
      image: v.variantImage,
      options
    })
  }

  return { variants, totalStock }
}

async function saveProduct(product: any, keyword?: string) {
  const pid = product.id || product.pid
  if (!pid) return null

  // Fetch detailed product info (includes variants)
  const detail = await fetchProductDetail(String(pid))
  if (!detail) return null

  const sellPrice = parsePrice(detail.sellPrice || product.sellPrice)
  if (sellPrice <= 0) return null

  const costPrice = sellPrice * 0.7
  let price = applyMarkup(costPrice)
  const compareAtPrice = sellPrice > price ? sellPrice : price * 1.3

  const images = extractImages(product, detail)
  if (images.length === 0) return null

  const category = mapCategory(
    detail.categoryName || product.threeCategoryName, 
    keyword
  )
  
  const tags = ["cj-dropshipping", "verified"]
  if (category !== "general") tags.push(category)
  if (keyword) tags.push(keyword.toLowerCase())

  // Extract variants
  const { variants, totalStock } = extractVariants(detail)
  
  // If variants exist, use the lowest variant price as base price
  if (variants.length > 0) {
    const lowestVariantPrice = Math.min(...variants.map(v => v.price))
    if (lowestVariantPrice > 0) {
      price = lowestVariantPrice
    }
  }

  const stock = totalStock > 0 ? totalStock : 100

  const data = {
    externalId: String(pid),
    title: (detail.productNameEn || product.nameEn || "Untitled").substring(0, 200),
    description: (detail.description || product.description || detail.productNameEn || "").substring(0, 1000),
    price,
    costPrice,
    compareAtPrice,
    images,
    category,
    tags: [...new Set(tags)],
    rating: +(Math.random() * 0.7 + 4.3).toFixed(1),
    reviewCount: Math.floor(Math.random() * 450 + 50),
    source: "cj-dropshipping",
    isActive: true,
    stock,
    variants: variants.length > 0 ? variants : null // Store as JSON
  }

  const result = await prisma.product.upsert({
    where: { externalId: String(pid) },
    update: data,
    create: data
  })

  return result
}

export async function POST(req: NextRequest) {
  const start = Date.now()

  try {
    const key = req.headers.get("x-api-key")
    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const keyword = body.keyword
    const count = Math.min(body.count || 5, 20) // Max 20 (because we fetch details)

    console.log(`📦 Fetching ${count} products for keyword: ${keyword || "all"}`)

    const products = await fetchCJProducts(keyword, count)

    console.log(`✅ Found ${products.length} products from CJ`)

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const p of products) {
      try {
        const existing = await prisma.product.findUnique({
          where: { externalId: String(p.id || p.pid) }
        })

        const result = await saveProduct(p, keyword)
        
        if (result) {
          if (existing) updated++
          else created++
        }

        // Rate limit: 1 request per second
        await new Promise(r => setTimeout(r, 1100))

      } catch (err: any) {
        errors.push(`Product ${p.id}: ${err.message}`)
      }
    }

    // Log the ingestion
    await prisma.ingestionLog.create({
      data: {
        source: keyword ? `cj-${keyword}` : "cj-general",
        productsAdded: created,
        productsUpdated: updated,
        status: errors.length > 0 ? "partial" : "success",
        errors: errors.length > 0 ? errors.join("\n") : null
      }
    })

    return NextResponse.json({
      success: true,
      created,
      updated,
      totalFetched: products.length,
      errors,
      time: `${Date.now() - start}ms`
    })

  } catch (err: any) {
    console.error("❌ Ingestion error:", err)

    await prisma.ingestionLog.create({
      data: {
        source: "cj-error",
        productsAdded: 0,
        productsUpdated: 0,
        status: "failed",
        errors: err.message
      }
    }).catch(() => {})

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
