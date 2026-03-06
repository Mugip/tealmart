// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!
const MAX_BATCH = 20

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function randomDiscount() {
  return Math.floor(Math.random() * 25) + 10 // 10-35% discount
}

function randomStock() {
  return Math.floor(Math.random() * 500) + 200 // 200-700 stock
}

function applyMarkup(cost: number): number {
  if (!cost || cost <= 0) return 0
  if (cost < 5) return +(cost * 3 - 0.01).toFixed(2)
  if (cost < 15) return +(cost * 2.2 - 0.01).toFixed(2)
  if (cost < 50) return +(cost * 1.8 - 0.01).toFixed(2)
  return +(cost * 1.5 - 0.01).toFixed(2)
}

// ============================================
// CATEGORY MAPPING FROM CJ CATEGORIES
// ============================================

function mapCJCategory(cjCategory: string): string {
  if (!cjCategory) return "general"
  
  const cat = cjCategory.toLowerCase()
  
  // Direct mappings
  const categoryMap: Record<string, string> = {
    // Electronics
    "phone": "phone",
    "mobile": "phone",
    "smartphone": "phone",
    "cell phone": "phone",
    "computer": "computer",
    "laptop": "computer",
    "tablet": "computer",
    "pc": "computer",
    "audio": "audio",
    "headphone": "audio",
    "earphone": "audio",
    "speaker": "audio",
    "camera": "camera",
    "photography": "camera",
    "gaming": "gaming",
    "game": "gaming",
    "console": "gaming",
    
    // Fashion
    "shoes": "shoes",
    "footwear": "shoes",
    "sneaker": "shoes",
    "boot": "shoes",
    "bag": "bags",
    "backpack": "bags",
    "handbag": "bags",
    "luggage": "bags",
    "watch": "watches",
    "timepiece": "watches",
    "jewelry": "jewelry",
    "necklace": "jewelry",
    "bracelet": "jewelry",
    "ring": "jewelry",
    "accessory": "accessories",
    "accessories": "accessories",
    "men": "mens-fashion",
    "women": "womens-fashion",
    "ladies": "womens-fashion",
    
    // Home
    "home": "home-garden",
    "garden": "home-garden",
    "furniture": "furniture",
    "kitchen": "kitchen",
    "cookware": "kitchen",
    "bedding": "bedding",
    "decor": "decor",
    "decoration": "decor",
    
    // Health & Beauty
    "beauty": "beauty",
    "cosmetic": "beauty",
    "makeup": "beauty",
    "skincare": "skincare",
    "skin care": "skincare",
    "health": "health",
    "fitness": "fitness",
    "exercise": "fitness",
    
    // Other
    "toy": "toys",
    "kids": "toys",
    "baby": "baby",
    "infant": "baby",
    "sport": "sports",
    "athletic": "sports",
    "pet": "pets",
    "dog": "pets",
    "cat": "pets",
    "automotive": "automotive",
    "car": "automotive",
  }
  
  // Check for exact matches first
  for (const [key, value] of Object.entries(categoryMap)) {
    if (cat.includes(key)) {
      return value
    }
  }
  
  // If no match, use the first part of CJ category
  const firstPart = cjCategory.split('>')[0].trim().toLowerCase()
  return firstPart.replace(/[^a-z0-9]+/g, '-').substring(0, 30) || "general"
}

// ============================================
// CJ API FUNCTIONS
// ============================================

async function cjFetch(url: string, retries = 3): Promise<any> {
  const token = await getCJToken()

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "CJ-Access-Token": token },
      })

      const data = await res.json()

      // Rate limit - retry after delay
      if (data.code === 1600200) {
        console.log("⚠️ Rate limited, waiting 2s...")
        await sleep(2000)
        continue
      }

      if (data.code !== 200) {
        throw new Error(`CJ API error: ${data.message || data.code}`)
      }

      return data
    } catch (err) {
      if (i === retries - 1) throw err
      await sleep(1000)
    }
  }
}

async function fetchCJProducts(keyword?: string, count = 10) {
  let page = 1
  let remaining = count
  const products: any[] = []

  while (remaining > 0 && page <= 10) { // Max 10 pages
    const size = Math.min(remaining, MAX_BATCH)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(size),
    })

    if (keyword) params.append("keyWord", keyword)

    const data = await cjFetch(`${CJ_API_URL}/product/listV2?${params}`)
    const list = data?.data?.content?.[0]?.productList || []

    if (!list.length) break

    products.push(...list)
    remaining -= list.length
    page++

    await sleep(1100) // Rate limit safety
  }

  return products.slice(0, count)
}

async function fetchProductDetail(pid: string) {
  const data = await cjFetch(`${CJ_API_URL}/product/query?pid=${pid}`)
  return data.data
}

// ============================================
// DATA EXTRACTION
// ============================================

function parsePrice(value: any): number {
  if (!value) return 0
  if (typeof value === "number") return value
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ""))
  return isNaN(num) ? 0 : num
}

function extractImages(product: any, detail?: any): string[] {
  const images: string[] = []
  
  if (detail?.productImage) images.push(detail.productImage)
  if (Array.isArray(detail?.productImageList)) images.push(...detail.productImageList)
  if (product?.bigImage) images.push(product.bigImage)
  if (Array.isArray(product?.productImageList)) images.push(...product.productImageList)

  return images
    .filter((img) => typeof img === "string" && img.startsWith("http"))
    .slice(0, 5)
}

function extractVariants(detail: any) {
  if (!detail?.variants) {
    return { variants: null, totalStock: randomStock() }
  }

  let raw = detail.variants
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: null, totalStock: randomStock() }
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    return { variants: null, totalStock: randomStock() }
  }

  const variants: any[] = []
  const optionNames: Set<string> = new Set()
  let totalStock = 0

  for (const v of raw) {
    const sellPrice = parsePrice(v.variantSellPrice || v.sellPrice)
    if (sellPrice <= 0) continue

    const costPrice = sellPrice * 0.7
    const price = applyMarkup(costPrice)
    const stock = Number(v.variantStock) > 0 ? Number(v.variantStock) : randomStock()
    
    totalStock += stock

    // Parse variant options
    const options: Record<string, string> = {}
    
    if (v.variantKey) {
      v.variantKey.split(";").forEach((part: string) => {
        const [name, value] = part.split("-").map((s: string) => s.trim())
        if (name && value) {
          options[name] = value
          optionNames.add(name)
        }
      })
    }
    
    // Fallback to variantName
    if (Object.keys(options).length === 0 && v.variantName) {
      const parts = v.variantName.split("-").map((s: string) => s.trim())
      if (parts.length === 2) {
        options["Color"] = parts[0]
        options["Size"] = parts[1]
        optionNames.add("Color")
        optionNames.add("Size")
      } else if (parts.length === 1 && parts[0]) {
        options["Option"] = parts[0]
        optionNames.add("Option")
      }
    }

    const label = Object.keys(options).length > 0
      ? Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(", ")
      : v.variantSku || `Variant ${variants.length + 1}`

    variants.push({
      id: v.vid,
      sku: v.variantSku || v.vid,
      name: label,
      price,
      costPrice,
      stock,
      image: v.variantImage,
      options,
    })
  }

  if (totalStock <= 0) totalStock = randomStock()

  return {
    variants: variants.length > 0 ? {
      options: Array.from(optionNames),
      items: variants,
    } : null,
    totalStock,
  }
}

// ============================================
// PRODUCT SAVE
// ============================================

async function saveProduct(product: any, keyword?: string) {
  const pid = product.id || product.pid
  if (!pid) return null

  const detail = await fetchProductDetail(String(pid))
  if (!detail) return null

  const sellPrice = parsePrice(detail.sellPrice || product.sellPrice)
  if (sellPrice <= 0) return null

  const costPrice = sellPrice * 0.7
  let price = applyMarkup(costPrice)

  // Random discount
  const discount = randomDiscount()
  const compareAtPrice = +(price / (1 - discount / 100)).toFixed(2)

  const images = extractImages(product, detail)
  if (images.length === 0) return null

  // Auto category from CJ
  const cjCategory = detail.categoryName || product.threeCategoryName || ""
  const category = mapCJCategory(cjCategory)

  // Extract variants
  const { variants, totalStock } = extractVariants(detail)

  // Use lowest variant price if available
  if (variants?.items?.length) {
    const lowestPrice = Math.min(...variants.items.map((v: any) => v.price))
    if (lowestPrice > 0) price = lowestPrice
  }

  // Tags
  const tags = ["cj-dropshipping", "verified"]
  if (category !== "general") tags.push(category)
  if (keyword) tags.push(keyword.toLowerCase())

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
    stock: totalStock,
    variants: variants || Prisma.JsonNull,
  }

  return await prisma.product.upsert({
    where: { externalId: String(pid) },
    update: data,
    create: data,
  })
}

// ============================================
// API ENDPOINT
// ============================================

export async function POST(req: NextRequest) {
  const start = Date.now()

  try {
    const key = req.headers.get("x-api-key")
    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const keyword = body.keyword
    const requested = body.count || 10

    console.log(`📦 Starting ingestion: ${requested} products, keyword: ${keyword || "all"}`)

    const batches = Math.ceil(requested / MAX_BATCH)
    let created = 0
    let updated = 0
    const errors: string[] = []

    for (let b = 0; b < batches; b++) {
      const count = Math.min(MAX_BATCH, requested - b * MAX_BATCH)
      console.log(`🔄 Batch ${b + 1}/${batches}: fetching ${count} products`)

      const products = await fetchCJProducts(keyword, count)

      for (const p of products) {
        try {
          const existing = await prisma.product.findUnique({
            where: { externalId: String(p.id || p.pid) },
          })

          const result = await saveProduct(p, keyword)

          if (result) {
            if (existing) updated++
            else created++
          }

          await sleep(1100)
        } catch (err: any) {
          errors.push(`${p.id}: ${err.message}`)
        }
      }
    }

    // Log ingestion
    await prisma.ingestionLog.create({
      data: {
        source: keyword ? `cj-${keyword}` : "cj-general",
        productsAdded: created,
        productsUpdated: updated,
        status: errors.length > 0 ? "partial" : "success",
        errors: errors.length > 0 ? errors.join("\n") : null,
      },
    })

    console.log(`✅ Completed: ${created} created, ${updated} updated, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      totalFetched: created + updated,
      errors,
      time: `${Date.now() - start}ms`,
    })
  } catch (err: any) {
    console.error("❌ Ingestion error:", err)

    await prisma.ingestionLog.create({
      data: {
        source: "cj-error",
        productsAdded: 0,
        productsUpdated: 0,
        status: "failed",
        errors: err.message,
      },
    }).catch(() => {})

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
