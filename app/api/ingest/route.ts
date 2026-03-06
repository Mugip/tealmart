// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

const CATEGORY_MAP: Record<string, string> = {
  "phone": "phone", "mobile": "phone", "shoes": "shoes", "bag": "bags",
  "watch": "watches", "jewellery": "jewellery", "electronics": "electronics",
  "computer": "computer", "audio": "audio", "camera": "camera",
  "home": "home-garden", "kitchen": "kitchen", "beauty": "beauty",
  "toy": "toys", "baby": "baby", "fitness": "fitness", "sports": "sports"
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
  let page = 1, remaining = count
  const products: any[] = []

  while (remaining > 0 && page <= 5) {
    const size = Math.min(remaining, 20)
    const params = new URLSearchParams({ page: String(page), pageSize: String(size) })
    if (keyword) params.append("keyWord", keyword)

    const res = await fetch(`${CJ_API_URL}/product/listV2?${params}`, {
      headers: { "CJ-Access-Token": token }
    })
    const data = await res.json()
    if (data.code !== 200) throw new Error(`CJ API: ${JSON.stringify(data)}`)

    const list = data?.data?.content?.[0]?.productList || []
    if (!list.length) break

    products.push(...list)
    remaining -= list.length
    page++
  }
  return products.slice(0, count)
}

async function fetchProductDetail(pid: string) {
  const token = await getCJToken()
  const res = await fetch(`${CJ_API_URL}/product/query?pid=${pid}`, {
    headers: { "CJ-Access-Token": token }
  })
  const data = await res.json()
  return data.code === 200 ? data.data : null
}

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
  if (!detail?.variants) return { variants: null, totalStock: 0 }

  let raw = detail.variants
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw) } catch { return { variants: null, totalStock: 0 } }
  }
  if (!Array.isArray(raw) || raw.length === 0) return { variants: null, totalStock: 0 }

  const variants: any[] = []
  let totalStock = 0
  const variantNames: Set<string> = new Set()

  for (const v of raw) {
    const sellPrice = parsePrice(v.variantSellPrice || v.sellPrice || 0)
    if (sellPrice <= 0) continue

    const costPrice = sellPrice * 0.7
    const price = applyMarkup(costPrice)
    const stock = Number(v.variantStock || 0)
    totalStock += stock

    // Parse variant options from variantKey or variantName
    const options: Record<string, string> = {}
    
    // Try variantKey first (format: "Color-Red;Size-M")
    if (v.variantKey) {
      v.variantKey.split(";").forEach((part: string) => {
        const [name, value] = part.split("-").map((s: string) => s.trim())
        if (name && value) {
          options[name] = value
          variantNames.add(name)
        }
      })
    }
    
    // Try variantName as fallback (format: "Red-M" or just "Red")
    if (Object.keys(options).length === 0 && v.variantName) {
      const parts = v.variantName.split("-").map((s: string) => s.trim())
      if (parts.length === 2) {
        options["Color"] = parts[0]
        options["Size"] = parts[1]
        variantNames.add("Color")
        variantNames.add("Size")
      } else if (parts.length === 1 && parts[0]) {
        options["Option"] = parts[0]
        variantNames.add("Option")
      }
    }

    // If still no options, use SKU as label
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
      options
    })
  }

  return { 
    variants: variants.length > 0 ? {
      options: Array.from(variantNames),
      items: variants
    } : null, 
    totalStock 
  }
}

async function saveProduct(product: any, keyword?: string) {
  const pid = product.id || product.pid
  if (!pid) return null

  const detail = await fetchProductDetail(String(pid))
  if (!detail) return null

  const sellPrice = parsePrice(detail.sellPrice || product.sellPrice)
  if (sellPrice <= 0) return null

  const costPrice = sellPrice * 0.7
  let price = applyMarkup(costPrice)
  const compareAtPrice = sellPrice > price ? sellPrice : price * 1.3

  const images = extractImages(product, detail)
  if (images.length === 0) return null

  const category = mapCategory(detail.categoryName || product.threeCategoryName, keyword)
  const tags = ["cj-dropshipping", "verified"]
  if (category !== "general") tags.push(category)
  if (keyword) tags.push(keyword.toLowerCase())

  const { variants, totalStock } = extractVariants(detail)
  
  if (variants && variants.items && variants.items.length > 0) {
    const lowestPrice = Math.min(...variants.items.map((v: any) => v.price))
    if (lowestPrice > 0) price = lowestPrice
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
    variants: variants || Prisma.JsonNull
  }

  return await prisma.product.upsert({
    where: { externalId: String(pid) },
    update: data,
    create: data
  })
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
    const count = Math.min(body.count || 5, 20)

    const products = await fetchCJProducts(keyword, count)
    let created = 0, updated = 0
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

        await new Promise(r => setTimeout(r, 1100))
      } catch (err: any) {
        errors.push(`${p.id}: ${err.message}`)
      }
    }

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
