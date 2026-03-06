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

/**
 * Check if a string looks like an SKU code
 */
function isSkuLikeVariant(str: string): boolean {
  if (!str) return false
  
  const normalized = str.trim().toUpperCase()
  
  // Pattern 1: CJYD196698201AZ - CJ prefix + letters + numbers + letters
  if (/^CJ[A-Z]{2}\d{8,15}[A-Z]{1,3}$/.test(normalized)) return true
  
  // Pattern 2: Starts with 2-6 letters, 8-15 numbers, ends with 1-3 letters
  if (/^[A-Z]{2,6}\d{8,15}[A-Z]{1,3}$/.test(normalized)) return true
  
  // Pattern 3: All caps alphanumeric, 10-20 chars, mixed letters and numbers
  if (/^[A-Z0-9]{10,20}$/.test(normalized) && /\d/.test(normalized) && /[A-Z]/.test(normalized)) return true
  
  // Pattern 4: Contains "SKU" or "ITEM" or "CODE"
  if (/SKU|ITEM|CODE/i.test(normalized)) return true
  
  return false
}

/**
 * Check if ALL variant names in a set look like SKUs
 */
function allVariantsAreSKUs(variants: any[]): boolean {
  if (variants.length === 0) return false
  
  return variants.every(v => {
    const name = v.variantName || v.sku || v.vid || ""
    return isSkuLikeVariant(name)
  })
}

/**
 * Check if options have meaningful names
 */
function hasValidVariantOptions(options: Record<string, string>): boolean {
  if (Object.keys(options).length === 0) return false
  
  const validOptionNames = ['color', 'size', 'style', 'material', 'pattern', 'type', 'model', 'version']
  
  const hasValidKey = Object.keys(options).some(key => 
    validOptionNames.includes(key.toLowerCase())
  )
  
  // Also check if values are meaningful (not SKU-like)
  const hasValidValue = Object.values(options).some(value => 
    !isSkuLikeVariant(value) && value.length < 20
  )
  
  return hasValidKey && hasValidValue
}

// ============================================
// CATEGORY MAPPING
// ============================================

function mapCJCategory(cjCategory: string): string {
  if (!cjCategory) return "general"
  
  const cat = cjCategory.toLowerCase()
  
  const categoryMap: Record<string, string> = {
    "phone": "phone", "mobile": "phone", "smartphone": "phone", "cell phone": "phone",
    "computer": "computer", "laptop": "computer", "tablet": "computer", "pc": "computer",
    "audio": "audio", "headphone": "audio", "earphone": "audio", "speaker": "audio",
    "camera": "camera", "photography": "camera",
    "gaming": "gaming", "game": "gaming", "console": "gaming",
    "shoes": "shoes", "footwear": "shoes", "sneaker": "shoes", "boot": "shoes",
    "bag": "bags", "backpack": "bags", "handbag": "bags", "luggage": "bags",
    "watch": "watches", "timepiece": "watches",
    "jewelry": "jewelry", "necklace": "jewelry", "bracelet": "jewelry", "ring": "jewelry",
    "accessory": "accessories", "accessories": "accessories",
    "men": "mens-fashion", "women": "womens-fashion", "ladies": "womens-fashion",
    "home": "home-garden", "garden": "home-garden",
    "furniture": "furniture", "kitchen": "kitchen", "cookware": "kitchen",
    "bedding": "bedding", "decor": "decor", "decoration": "decor",
    "beauty": "beauty", "cosmetic": "beauty", "makeup": "beauty",
    "skincare": "skincare", "skin care": "skincare",
    "health": "health", "fitness": "fitness", "exercise": "fitness",
    "toy": "toys", "kids": "toys", "baby": "baby", "infant": "baby",
    "sport": "sports", "athletic": "sports",
    "pet": "pets", "dog": "pets", "cat": "pets",
    "automotive": "automotive", "car": "automotive",
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

  // FIRST: Check if ALL variants are SKU-like
  if (allVariantsAreSKUs(raw)) {
    console.log(`⚠️ All variants are SKU-like - skipping product`)
    return { variants: null, totalStock: 0, skipped: true }
  }

  const variants: any[] = []
  const optionNames: Set<string> = new Set()
  let totalStock = 0
  let skippedCount = 0

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
        if (name && value && !isSkuLikeVariant(value)) {
          options[name] = value
          optionNames.add(name)
        }
      })
    }
    
    // Fallback to variantName
    if (Object.keys(options).length === 0 && v.variantName) {
      // Skip if variantName is SKU-like
      if (isSkuLikeVariant(v.variantName)) {
        skippedCount++
        continue
      }

      const parts = v.variantName.split("-").map((s: string) => s.trim())
      if (parts.length === 2 && !isSkuLikeVariant(parts[0]) && !isSkuLikeVariant(parts[1])) {
        options["Color"] = parts[0]
        options["Size"] = parts[1]
        optionNames.add("Color")
        optionNames.add("Size")
      } else if (parts.length === 1 && parts[0] && !isSkuLikeVariant(parts[0])) {
        options["Option"] = parts[0]
        optionNames.add("Option")
      } else {
        skippedCount++
        continue
      }
    }

    // Validate options
    if (!hasValidVariantOptions(options)) {
      skippedCount++
      continue
    }

    const label = Object.keys(options).length > 0
      ? Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(", ")
      : `Variant ${variants.length + 1}`

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

  // If we skipped all variants, reject the product
  if (variants.length === 0 && skippedCount > 0) {
    console.log(`⚠️ All ${skippedCount} variants were SKU-like - skipping product`)
    return { variants: null, totalStock: 0, skipped: true }
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

  const discount = randomDiscount()
  const compareAtPrice = +(price / (1 - discount / 100)).toFixed(2)

  const images = extractImages(product, detail)
  if (images.length === 0) return null

  const cjCategory = detail.categoryName || product.threeCategoryName || ""
  const category = mapCJCategory(cjCategory)

  // Extract variants with SKU filtering
  const { variants, totalStock, skipped } = extractVariants(detail)

  // Skip products with only SKU-like variants
  if (skipped) {
    console.log(`❌ Skipped product ${pid} - SKU-like variants only`)
    return null
  }

  // Use lowest variant price if available
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
    let skipped = 0
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
          } else {
            skipped++
          }

          await sleep(1100)
        } catch (err: any) {
          errors.push(`${p.id}: ${err.message}`)
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
