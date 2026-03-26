// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"
import { classifyProduct } from "@/lib/productClassifier"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!
const MAX_BATCH = 20

// In-memory cache for product details
const productDetailCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

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

// Check if ID is UUID format (orderable products)
function isUUID(id: string): boolean {
  const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
  return uuidRegex.test(id)
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
// CJ API WITH CACHING
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
  const allProducts: any[] = []
  const targetPages = Math.ceil(count / MAX_BATCH) * 5 // Fetch more pages to account for filtering
  
  for (let page = 1; page <= targetPages && page <= 20; page++) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(MAX_BATCH),
    })

    if (keyword) params.append("keyWord", keyword)

    console.log(`🔍 Fetching CJ page ${page}`)

    const data = await cjFetch(`${CJ_API_URL}/product/listV2?${params}`)
    const list = data?.data?.content?.[0]?.productList || []

    if (!list.length) {
      console.log(`⚠️ No products on page ${page}, stopping`)
      break
    }

    console.log(`📥 Got ${list.length} products from page ${page}`)
    allProducts.push(...list)

    await sleep(1100)
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique: any[] = []
  
  for (const p of allProducts) {
    const pid = String(p.id || p.pid)
    if (!seen.has(pid)) {
      seen.add(pid)
      unique.push(p)
    }
  }

  console.log(`✨ Deduped: ${allProducts.length} total → ${unique.length} unique`)
  
  // FILTER: Only keep UUID products
  const uuidProducts = unique.filter(p => {
    const pid = String(p.id || p.pid)
    return isUUID(pid)
  })
  
  console.log(`🔑 UUID filter: ${unique.length} total → ${uuidProducts.length} UUID products (orderable)`)
  console.log(`❌ Filtered out ${unique.length - uuidProducts.length} non-UUID products`)
  
  return uuidProducts.slice(0, count)
}

// CACHED product detail fetch - Only for UUID products
async function fetchProductDetail(pid: string) {
  const now = Date.now()
  const cached = productDetailCache.get(pid)
  
  // Return cached if valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`💾 Memory cache hit for product ${pid}`)
    return cached.data
  }

  // Check database for existing UUID product
  const existing = await prisma.product.findUnique({
    where: { externalId: pid },
    select: {
      description: true,
      variants: true,
      images: true,
      title: true,
      category: true,
      price: true,
      costPrice: true,
    }
  })

  if (existing) {
    console.log(`🗄️ DB cache hit for product ${pid}`)
    const dbData = {
      productNameEn: existing.title,
      description: existing.description,
      variants: existing.variants,
      productImageList: existing.images,
      sellPrice: existing.price,
      categoryName: existing.category,
    }
    
    // Cache it in memory
    productDetailCache.set(pid, { data: dbData, timestamp: now })
    return dbData
  }

  // Fetch from CJ API as last resort
  console.log(`🌐 Fetching from CJ API for UUID product ${pid}`)
  const data = await cjFetch(`${CJ_API_URL}/product/query?pid=${pid}`)
  
  // Cache the result
  productDetailCache.set(pid, { data: data.data, timestamp: now })
  
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

function extractVariants(detail: any, productPid: string) {
  if (!detail?.variants) {
    console.log(`ℹ️ Product ${productPid} has no variants`)
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
    console.log(`ℹ️ Product ${productPid} variants is not an array or empty`)
    return { variants: null, totalStock: randomStock(), skipped: false }
  }

  console.log(`📦 Product ${productPid} has ${raw.length} variants`)

  if (allVariantsAreSkus(raw)) {
    console.log(`⚠️ Product ${productPid} has SKU-only variants, skipping`)
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
      if (isObviousSkuCode(v.variantName)) continue

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

    const variantId = v.vid || v.variantId || v.id || v.vId
    
    if (!variantId) {
      console.warn(`⚠️ Variant has no ID in product ${productPid}`)
      continue
    }

    console.log(`✅ Storing variant ${variantId} for product ${productPid}`)

    variants.push({
      id: String(variantId),
      sku: v.variantSku || String(variantId),
      name: variantLabel,
      price,
      costPrice,
      stock,
      image: v.variantImage,
      options,
    })
  }

  if (variants.length === 0) {
    console.log(`⚠️ Product ${productPid} ended up with 0 valid variants`)
    return { variants: null, totalStock: 0, skipped: true }
  }

  if (hasGenericLabels && variants.every(v => v.name.startsWith("Option "))) {
    console.log(`ℹ️ Product ${productPid} has only generic labels, hiding variants`)
    return { variants: null, totalStock, skipped: false }
  }

  if (totalStock <= 0) totalStock = randomStock()

  console.log(`✅ Product ${productPid} successfully extracted ${variants.length} variants`)

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

  // SKIP non-UUID products
  if (!isUUID(String(pid))) {
    console.log(`⏭️ Skipping non-UUID product: ${pid}`)
    return { result: null, wasExisting: false }
  }

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
  
  const category = await classifyProduct(productTitle, productDescription, cjCategory)

  const { variants, totalStock, skipped } = extractVariants(detail, String(pid))

  if (skipped) return { result: null, wasExisting: false }
  if (!variants && descriptionMentionsSizes(productDescription)) return { result: null, wasExisting: false }

  if (variants?.items?.length) {
    const lowestPrice = Math.min(...variants.items.map((v: any) => v.price))
    if (lowestPrice > 0) price = lowestPrice
  }

  const tags = ["tealmart", "verified"]
  if (category !== "General") tags.push(category)
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
  // 🔐 Auth (browser-friendly via query param)
  const url = new URL(req.url)
  const secret = url.searchParams.get('key')

  if (INGESTION_API_KEY && secret !== INGESTION_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  
  try {

    const body = await req.json()
    const keyword = body.keyword
    const requested = body.count || 10

    console.log(`📦 Ingesting ${requested} UUID products, keyword: ${keyword || "all"}`)
    console.log(`💾 Cache size: ${productDetailCache.size} products`)

    const existingProducts = await prisma.product.findMany({
      select: { externalId: true }
    })
    const existingIds = new Set(
      existingProducts
        .map(p => p.externalId)
        .filter((id): id is string => id !== null)
    )

    const products = await fetchCJProducts(keyword, requested)
    console.log(`🎯 Processing ${products.length} UUID products`)

    let created = 0
    let updated = 0
    let skipped = 0
    let apiCalls = 0
    let cacheHits = 0
    const errors: string[] = []

    for (const p of products) {
      try {
        const pid = String(p.id || p.pid)
        const hadCache = productDetailCache.has(pid) || existingIds.has(pid)
        
        const { result, wasExisting } = await saveProduct(p, existingIds, keyword)

        if (hadCache) cacheHits++
        else apiCalls++

        if (result) {
          if (wasExisting) updated++
          else created++
        } else {
          skipped++
        }

        await sleep(1100)
      } catch (err: any) {
        errors.push(`${p.id}: ${err.message}`)
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

    console.log(`✅ Done: ${created} created, ${updated} updated, ${skipped} skipped`)
    console.log(`📊 API calls: ${apiCalls}, Cache hits: ${cacheHits}`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      totalFetched: created + updated,
      databaseCount: finalCount,
      apiCallsUsed: apiCalls,
      cacheHits,
      errors,
      time: `${Date.now() - start}ms`,
    })
  } catch (err: any) {
    console.error("❌ Error:", err)

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
