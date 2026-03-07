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
  return Math.floor(Math.random() * 25) + 10
}

function randomStock() {
  return Math.floor(Math.random() * 500) + 200
}

function applyMarkup(cost: number): number {
  if (!cost || cost <= 0) return 0
  if (cost < 5) return +(cost * 3 - 0.01).toFixed(2)
  if (cost < 15) return +(cost * 2.2 - 0.01).toFixed(2)
  if (cost < 50) return +(cost * 1.8 - 0.01).toFixed(2)
  return +(cost * 1.5 - 0.01).toFixed(2)
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function isObviousSkuCode(str: string): boolean {
  if (!str || str.length < 10) return false
  
  const normalized = str.trim().toUpperCase()
  
  // CJ SKU pattern: CJYD196698201AZ
  if (/^CJ[A-Z]{2}\d{9,15}[A-Z]{1,3}$/.test(normalized)) return true
  
  // Generic SKU: 4+ letters, 9+ digits, 2+ letters
  if (/^[A-Z]{4,}\d{9,}[A-Z]{2,}$/.test(normalized)) return true
  
  return false
}

function allVariantsAreSkus(variants: any[]): boolean {
  if (variants.length === 0) return false
  
  const skuCount = variants.filter(v => {
    const name = v.variantName || ""
    return isObviousSkuCode(name)
  }).length
  
  return skuCount / variants.length >= 0.8
}

// ============================================
// CATEGORY MAPPING
// ============================================

function mapCJCategory(cjCategory: string): string {
  if (!cjCategory) return "general"
  
  const cat = cjCategory.toLowerCase()
  
  const categoryMap: Record<string, string> = {
    "phone": "phone", "mobile": "phone", "smartphone": "phone",
    "computer": "computer", "laptop": "computer", "tablet": "computer",
    "audio": "audio", "headphone": "audio", "speaker": "audio",
    "camera": "camera", "gaming": "gaming",
    "shoes": "shoes", "footwear": "shoes",
    "bag": "bags", "backpack": "bags",
    "watch": "watches", "jewelry": "jewelry",
    "accessory": "accessories", "men": "mens-fashion",
    "women": "womens-fashion", "home": "home-garden",
    "furniture": "furniture", "kitchen": "kitchen",
    "beauty": "beauty", "skincare": "skincare",
    "health": "health", "fitness": "fitness",
    "toy": "toys", "baby": "baby", "sport": "sports",
    "pet": "pets", "automotive": "automotive",
  }
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (cat.includes(key)) return value
  }
  
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

  while (remaining > 0 && page <= 10) {
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

    await sleep(1100)
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
    return { variants: null, totalStock: randomStock(), skipped: false }
  }

  let raw = detail.variants
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: null, totalStock: randomStock(), skipped: false }
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    return { variants: null, totalStock: randomStock(), skipped: false }
  }

  // Check if product should be skipped (80%+ obvious SKUs)
  if (allVariantsAreSkus(raw)) {
    console.log(`⚠️ Product has 80%+ SKU-like variants - skipping`)
    return { variants: null, totalStock: 0, skipped: true }
  }

  const variants: any[] = []
  const optionNames: Set<string> = new Set()
  let totalStock = 0
  let hasGenericLabels = false

  for (const v of raw) {
    const sellPrice = parsePrice(v.variantSellPrice || v.sellPrice)
    if (sellPrice <= 0) continue

    const costPrice = sellPrice * 0.7
    const price = applyMarkup(costPrice)
    const stock = Number(v.variantStock) > 0 ? Number(v.variantStock) : randomStock()
    
    totalStock += stock

    // Parse variant options
    const options: Record<string, string> = {}
    let variantLabel = ""
    
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
      if (isObviousSkuCode(v.variantName)) {
        continue // Skip SKU variants
      }

      const parts = v.variantName.split("-").map((s: string) => s.trim())
      if (parts.length === 2) {
        options["Color"] = parts[0]
        options["Size"] = parts[1]
        optionNames.add("Color")
        optionNames.add("Size")
      } else if (parts.length === 1 && parts[0]) {
        options["Style"] = parts[0]
        optionNames.add("Style")
      }
    }

    // Build label
    if (Object.keys(options).length > 0) {
      variantLabel = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(", ")
    } else if (v.variantName && !isObviousSkuCode(v.variantName)) {
      variantLabel = v.variantName
    } else {
      // Generic fallback - we'll handle this later
      variantLabel = `Option ${variants.length + 1}`
      hasGenericLabels = true
    }

    variants.push({
      id: v.vid,
      sku: v.variantSku || v.vid,
      name: variantLabel,
      price,
      costPrice,
      stock,
      image: v.variantImage,
      options,
    })
  }

  if (variants.length === 0) {
    console.log(`⚠️ No valid variants after filtering - skipping`)
    return { variants: null, totalStock: 0, skipped: true }
  }

  // If all variants have generic labels like "Option 1", "Option 2", don't show variants
  if (hasGenericLabels && variants.every(v => v.name.startsWith("Option "))) {
    console.log(`⚠️ Variants have generic labels - hiding variant selector`)
    return { variants: null, totalStock, skipped: false }
  }

  if (totalStock <= 0) totalStock = randomStock()

  return {
    variants: variants.length > 0 ? {
      options: Array.from(optionNames),
      items: variants,
    } : null,
    totalStock,
    skipped: false,
  }
}

// ============================================
// PRODUCT SAVE - FIXED PARAMETER ORDER
// ============================================

async function saveProduct(product: any, existingProducts: Set<string>, keyword?: string) {
  const pid = product.id || product.pid
  if (!pid) return { result: null, wasExisting: false }

  // Check if product already exists in DB
  const wasExisting = existingProducts.has(String(pid))

  const detail = await fetchProductDetail(String(pid))
  if (!detail) return { result: null, wasExisting: false }

  const sellPrice = parsePrice(detail.sellPrice || product.sellPrice)
  if (sellPrice <= 0) return { result: null, wasExisting: false }

  const costPrice = sellPrice * 0.7
  let price = applyMarkup(costPrice)

  const discount = randomDiscount()
  const compareAtPrice = +(price / (1 - discount / 100)).toFixed(2)

  const images = extractImages(product, detail)
  if (images.length === 0) return { result: null, wasExisting: false }

  const cjCategory = detail.categoryName || product.threeCategoryName || ""
  const category = mapCJCategory(cjCategory)

  const { variants, totalStock, skipped } = extractVariants(detail)

  if (skipped) {
    console.log(`❌ Skipped product ${pid}`)
    return { result: null, wasExisting: false }
  }

  if (variants?.items?.length) {
    const lowestPrice = Math.min(...variants.items.map((v: any) => v.price))
    if (lowestPrice > 0) price = lowestPrice
  }

  const tags = ["tealmart", "verified"]
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

  const result = await prisma.product.upsert({
    where: { externalId: String(pid) },
    update: data,
    create: data,
  })

  return { result, wasExisting }
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

    // Get all existing product externalIds BEFORE ingestion
    const existingProducts = await prisma.product.findMany({
      select: { externalId: true }
    })
    const existingIds = new Set(existingProducts.map(p => p.externalId))
    console.log(`📊 Found ${existingIds.size} existing products in database`)

    const batches = Math.ceil(requested / MAX_BATCH)
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (let b = 0; b < batches; b++) {
      const count = Math.min(MAX_BATCH, requested - b * MAX_BATCH)
      console.log(`🔄 Batch ${b + 1}/${batches}: fetching ${count} products`)

      const products = await fetchCJProducts(keyword, count)

      for (const p of products) {
        try {
          const { result, wasExisting } = await saveProduct(p, existingIds, keyword)

          if (result) {
            if (wasExisting) {
              updated++
            } else {
              created++
            }
          } else {
            skipped++
          }

          await sleep(1100)
        } catch (err: any) {
          errors.push(`${p.id}: ${err.message}`)
          console.error(`Error processing ${p.id}:`, err)
        }
      }
    }

    await prisma.ingestionLog.create({
      data: {
        source: keyword ? `cj-${keyword}` : "cj-general",
        productsAdded: created,
        productsUpdated: updated,
        status: errors.length > 0 ? "partial" : "success",
        errors: errors.length > 0 ? errors.join("\n") : null,
      },
    })

    console.log(`✅ Completed: ${created} created, ${updated} updated, ${skipped} skipped, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
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
