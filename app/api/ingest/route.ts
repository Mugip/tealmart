import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

const MAX_BATCH = 20

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function randomDiscount() {
  return Math.floor(Math.random() * 25) + 10
}

function applyMarkup(cost: number): number {
  if (!cost || cost <= 0) return 0

  if (cost < 5) return +(cost * 3).toFixed(2)
  if (cost < 15) return +(cost * 2.2).toFixed(2)
  if (cost < 50) return +(cost * 1.8).toFixed(2)

  return +(cost * 1.5).toFixed(2)
}

async function cjFetch(url: string) {
  const token = await getCJToken()

  const res = await fetch(url, {
    headers: { "CJ-Access-Token": token },
  })

  const data = await res.json()

  if (data.code === 1600200) {
    await sleep(2000)
    return cjFetch(url)
  }

  if (data.code !== 200) {
    throw new Error(`CJ API: ${JSON.stringify(data)}`)
  }

  return data
}

async function fetchCJProducts(keyword?: string, count = 10) {
  let page = 1
  let remaining = count
  const products: any[] = []

  while (remaining > 0) {
    const size = Math.min(remaining, MAX_BATCH)

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(size),
    })

    if (keyword) params.append("keyWord", keyword)

    const data = await cjFetch(
      `${CJ_API_URL}/product/listV2?${params.toString()}`
    )

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
  const data = await cjFetch(
    `${CJ_API_URL}/product/query?pid=${pid}`
  )

  return data.data
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

  if (Array.isArray(detail?.productImageList))
    images.push(...detail.productImageList)

  if (product?.bigImage) images.push(product.bigImage)

  if (Array.isArray(product?.productImageList))
    images.push(...product.productImageList)

  return images
    .filter((img) => typeof img === "string" && img.startsWith("http"))
    .slice(0, 5)
}

function extractVariants(detail: any) {
  if (!detail?.variants)
    return { variants: null, totalStock: 100 }

  let raw = detail.variants

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: null, totalStock: 100 }
    }
  }

  if (!Array.isArray(raw))
    return { variants: null, totalStock: 100 }

  const variants: any[] = []

  let totalStock = 0

  for (const v of raw) {
    const sellPrice = parsePrice(
      v.variantSellPrice || v.sellPrice
    )

    if (sellPrice <= 0) continue

    const cost = sellPrice * 0.7

    const price = applyMarkup(cost)

    let stock = Number(v.variantStock || 0)

    if (stock <= 0) stock = 100

    totalStock += stock

    variants.push({
      id: v.vid,
      sku: v.variantSku || v.vid,
      price,
      stock,
      image: v.variantImage,
      options: {},
    })
  }

  if (totalStock <= 0) totalStock = 100

  return {
    variants:
      variants.length > 0
        ? { options: [], items: variants }
        : null,
    totalStock,
  }
}

async function saveProduct(product: any, keyword?: string) {
  const pid = product.id || product.pid

  if (!pid) return null

  const detail = await fetchProductDetail(String(pid))

  if (!detail) return null

  const sellPrice = parsePrice(
    detail.sellPrice || product.sellPrice
  )

  if (sellPrice <= 0) return null

  const costPrice = sellPrice * 0.7

  let price = applyMarkup(costPrice)

  const discount = randomDiscount()

  const compareAtPrice = +(price / (1 - discount / 100)).toFixed(2)

  const images = extractImages(product, detail)

  if (images.length === 0) return null

  const { variants, totalStock } = extractVariants(detail)

  if (variants?.items?.length) {
    const lowest = Math.min(
      ...variants.items.map((v: any) => v.price)
    )

    if (lowest > 0) price = lowest
  }

  const data = {
    externalId: String(pid),

    title: (detail.productNameEn || product.nameEn || "Untitled").substring(0,200),

    description: (detail.description || "").substring(0,1000),

    price,

    costPrice,

    compareAtPrice,

    images,

    category: "general",

    tags: ["verified", keyword || "product"],

    rating: +(Math.random() * 0.7 + 4.3).toFixed(1),

    reviewCount: Math.floor(Math.random() * 500 + 50),

    source: "cj",

    isActive: true,

    stock: totalStock || 100,

    variants: variants ? variants : { options: [], items: [] },
  }

  return prisma.product.upsert({
    where: { externalId: String(pid) },
    update: data,
    create: data,
  })
}

export async function POST(req: NextRequest) {
  const start = Date.now()

  try {
    const key = req.headers.get("x-api-key")

    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY)
      return NextResponse.json({ error: "Unauthorized" },{ status: 401 })

    const body = await req.json()

    const keyword = body.keyword

    const requested = body.count || 10

    const batches = Math.ceil(requested / MAX_BATCH)

    let created = 0
    let updated = 0

    const errors: string[] = []

    for (let b = 0; b < batches; b++) {
      const count = Math.min(MAX_BATCH, requested - b * MAX_BATCH)

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
          errors.push(err.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      time: `${Date.now() - start}ms`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message },{ status: 500 })
  }
}
