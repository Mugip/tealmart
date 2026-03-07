// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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
  
  if (/^CJ[A-Z]{2}\d{9,15}[A-Z]{1,3}$/.test(normalized)) return true
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

function descriptionMentionsSizes(description: string): boolean {
  const desc = description.toLowerCase()
  const sizeKeywords = [
    'size chart', 'choose size', 'asian size', 'european size',
    'choose the larger size', 'please check the size',
    's/m/l', 'xs/s/m/l/xl'
  ]
  return sizeKeywords.some(kw => desc.includes(kw))
}

// ============================================
// IMPROVED CATEGORY MAPPING
// ============================================

function mapCJCategory(cjCategory: string, productTitle?: string, description?: string): string {
  if (!cjCategory) return "general"
  
  const cat = cjCategory.toLowerCase()
  const title = (productTitle || "").toLowerCase()
  const desc = (description || "").toLowerCase()
  const combined = `${cat} ${title} ${desc}`
  
  const womenKeywords = ['women', 'ladies', 'lady', 'girl', 'female', 'dress', 'skirt', 'bra', 'heels', 'handbag', 'purse']
  if (womenKeywords.some(kw => combined.includes(kw))) {
    return "womens-fashion"
  }
  
  const menKeywords = ['men', 'male', 'gentleman', 'beard']
  if (menKeywords.some(kw => combined.includes(kw))) {
    return "mens-fashion"
  }
  
  const categoryMap: Record<string, string[]> = {
    "phone": ["phone", "mobile", "smartphone", "cell phone", "iphone", "samsung galaxy"],
    "computer": ["computer", "laptop", "tablet", "pc", "macbook", "chromebook"],
    "audio": ["audio", "headphone", "earphone", "speaker", "airpods", "earbuds"],
    "camera": ["camera", "photography", "gopro", "canon", "nikon"],
    "gaming": ["gaming", "game", "console", "playstation", "xbox", "nintendo"],
    "shoes": ["shoes", "footwear", "sneaker", "boot", "sandal", "slipper"],
    "bags": ["bag", "backpack", "luggage", "suitcase"],
    "watches": ["watch", "timepiece", "smartwatch"],
    "jewelry": ["jewelry", "jewellery", "necklace", "bracelet", "ring", "earring"],
    "accessories": ["accessory", "accessories", "belt", "scarf", "hat", "cap"],
    "home-garden": ["home", "garden", "outdoor", "patio"],
    "furniture": ["furniture", "chair", "table", "sofa", "couch", "desk"],
    "kitchen": ["kitchen", "cookware", "utensil", "appliance"],
    "bedding": ["bedding", "sheet", "pillow", "blanket", "comforter"],
    "decor": ["decor", "decoration", "wall art", "vase", "candle"],
    "beauty": ["beauty", "cosmetic", "makeup", "lipstick", "foundation"],
    "skincare": ["skincare", "skin care", "moisturizer", "serum", "cleanser"],
    "health": ["health", "vitamin", "supplement", "wellness"],
    "fitness": ["fitness", "exercise", "workout", "gym", "yoga"],
    "toys": ["toy", "kids", "children", "play"],
    "baby": ["baby", "infant", "newborn", "toddler"],
    "sports": ["sport", "athletic", "running", "tennis", "basketball"],
    "pets": ["pet", "dog", "cat", "animal"],
    "automotive": ["automotive", "car", "vehicle", "motorcycle"],
  }
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => combined.includes(kw))) {
      return category
    }
  }
  
  const firstPart = cjCategory.split('>')[0].trim().toLowerCase()
  return firstPart.replace(/[^a-z0-9]+/g, '-').substring(0, 30) || "general"
}

// ============================================
// CJ API FUNCTIONS - FIXED PAGINATION
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
  const products: any[] = []
  const seenIds = new Set<string>()
  let page = 1
  const maxPages = Math.ceil(count / MAX_BATCH) + 2 // Add buffer for duplicates

  while (products.length < count && page <= maxPages) {
    const params = new URLSearchParams({
      pageNum: String(page), // Changed from 'page' to 'pageNum'
      pageSize: String(MAX_BATCH),
    })

    if (keyword) params.append("keyWord", keyword)

    console.log(`🔍 Fetching page ${page} with params: ${params.toString()}`)

    const data = await cjFetch(`${CJ_API_URL}/product/list?${params}`) // Changed endpoint
    const list = data?.data?.list || data?.data?.content?.[0]?.productList || []

    if (!list.length) {
      console.log(`⚠️ No products returned for page ${page}`)
      break
    }

    console.log(`📥 Received ${list.length} products from page ${page}`)

    // Filter out duplicates
    let newProductsCount = 0
    for (const product of list) {
      const pid = String(product.id || product.pid)
      if (!seenIds.has(pid)) {
        seenIds.add(pid)
        products.push(product)
        newProductsCount++
      }
    }

    console.log(`✨ ${newProductsCount} new unique products from page ${page}`)

    // If we got zero new products, CJ API might be broken - try different approach
    if (newProductsCount === 0) {
      console.log(`⚠️ No new products on page ${page}, stopping pagination`)
      break
    }

    page++
    await sleep(1100)
  }

  console.log(`🎯 Total unique products collected: ${products.length}`)
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

  if (allVariantsAreSkus(raw)) {
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
    
    if (Object.keys(options).length === 0 && v.variantName) {
      if (isObviousSkuCode(v.variantName)) {
        continue
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

    if (Object.keys(options).length > 0) {
      variantLabel = Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(", ")
    } else if (v.variantName && !isObviousSkuCode(v.variantName)) {
      variantLabel = v.variantName
    } else {
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
    return { variants: null, totalStock: 0, skipped: true }
  }

  if (hasGenericLabels && variants.every(v => v.name.startsWith("Option "))) {
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
// PRODUCT SAVE
// ============================================

async function saveProduct(product: any, existingProducts: Set<string>, keyword?: string) {
  const pid = product.id || product.pid
  if (!pid) return { result: null, wasExisting: false }

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

  const productTitle = detail.productNameEn || product.nameEn || ""
  const productDescription = detail.description || product.description || ""
  const cjCategory = detail.categoryName || product.threeCategoryName || ""
  
  const category = mapCJCategory(cjCategory, productTitle, productDescription)

  const { variants, totalStock, skipped } = extractVariants(detail)

  if (skipped) {
    return { result: null, wasExisting: false }
  }

  if (!variants && descriptionMentionsSizes(productDescription)) {
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
    title: productTitle.substring(0, 200),
    description: productDescription.substring(0, 5000),
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

    const existingProducts = await prisma.product.findMany({
      select: { externalId: true }
    })
    const existingIds = new Set(
      existingProducts
        .map(p => p.externalId)
        .filter((id): id is string => id !== null)
    )

    // Fetch ALL products at once with proper pagination
    const products = await fetchCJProducts(keyword, requested)
    console.log(`📥 Fetched ${products.length} unique products total`)

    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

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
        console.error(`❌ Error processing ${p.id}:`, err)
      }
    }

    const finalCount = await prisma.product.count()

    await prisma.ingestionLog.create({
      data: {
        source: keyword ? `cj-${keyword}` : "cj-general",
        productsAdded: created,
        productsUpdated: updated,
        status: errors.length > 0 ? "partial" : "success",
        errors: errors.length > 0 ? errors.join("\n") : null,
      },
    })

    console.log(`✅ FINAL: ${created} created, ${updated} updated, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      totalFetched: created + updated,
      databaseCount: finalCount,
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
  } finally {
    await prisma.$disconnect()
  }
}
