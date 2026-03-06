// app/api/ingest/route.ts

import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

/* ------------------------------------------------ */
/* CJ GLOBAL RATE LIMITER (PREVENTS QPS ERRORS) */
/* ------------------------------------------------ */

let lastCJCall = 0

async function cjFetch(url: string, options: any) {
  const now = Date.now()

  const wait = 1200 - (now - lastCJCall)

  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait))
  }

  lastCJCall = Date.now()

  return fetch(url, options)
}

/* ------------------------------------------------ */
/* CATEGORY MAPPING */
/* ------------------------------------------------ */

const CATEGORY_MAP: Record<string, string> = {
  phone: "phone",
  mobile: "phone",
  shoes: "shoes",
  bag: "bags",
  watch: "watches",
  jewelry: "jewelry",
  electronics: "electronics",
  computer: "computer",
  audio: "audio",
  camera: "camera",
  home: "home-garden",
  kitchen: "kitchen",
  beauty: "beauty",
  toy: "toys",
  baby: "baby",
  fitness: "fitness",
  sports: "sports",
}

function mapCategory(cjCategory?: string, keyword?: string): string {
  const search = `${cjCategory || ""} ${keyword || ""}`.toLowerCase()

  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (search.includes(key)) return value
  }

  return "general"
}

/* ------------------------------------------------ */
/* PRICE MARKUP */
/* ------------------------------------------------ */

function applyMarkup(cost: number): number {
  if (!cost || cost <= 0) return 0

  if (cost < 5) return +(cost * 3 - 0.01).toFixed(2)

  if (cost < 15) return +(cost * 2.2 - 0.01).toFixed(2)

  if (cost < 50) return +(cost * 1.8 - 0.01).toFixed(2)

  return +(cost * 1.5 - 0.01).toFixed(2)
}

/* ------------------------------------------------ */
/* CJ PRODUCT FETCH */
/* ------------------------------------------------ */

async function fetchCJProducts(keyword?: string, count = 10) {
  const token = await getCJToken()

  let page = 1
  let remaining = count

  const products: any[] = []

  while (remaining > 0 && page <= 5) {
    const size = Math.min(remaining, 20)

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(size),
    })

    if (keyword) params.append("keyWord", keyword)

    const res = await cjFetch(
      `${CJ_API_URL}/product/listV2?${params}`,
      {
        headers: {
          "CJ-Access-Token": token,
        },
      }
    )

    const data = await res.json()

    if (data.code !== 200)
      throw new Error(`CJ API: ${JSON.stringify(data)}`)

    const list = data?.data?.content?.[0]?.productList || []

    if (!list.length) break

    products.push(...list)

    remaining -= list.length
    page++
  }

  return products.slice(0, count)
}

/* ------------------------------------------------ */
/* PRODUCT DETAIL */
/* ------------------------------------------------ */

async function fetchProductDetail(pid: string) {
  const token = await getCJToken()

  const res = await cjFetch(
    `${CJ_API_URL}/product/query?pid=${pid}`,
    {
      headers: {
        "CJ-Access-Token": token,
      },
    }
  )

  const data = await res.json()

  return data.code === 200 ? data.data : null
}

/* ------------------------------------------------ */
/* PRICE PARSER */
/* ------------------------------------------------ */

function parsePrice(value: any): number {
  if (!value) return 0

  if (typeof value === "number") return value

  const num = parseFloat(String(value).replace(/[^0-9.]/g, ""))

  return isNaN(num) ? 0 : num
}

/* ------------------------------------------------ */
/* IMAGE EXTRACTION */
/* ------------------------------------------------ */

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

/* ------------------------------------------------ */
/* VARIANTS */
/* ------------------------------------------------ */

function extractVariants(detail: any) {
  if (!detail?.variants)
    return { variants: { options: [], items: [] }, totalStock: 100 }

  let raw = detail.variants

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: { options: [], items: [] }, totalStock: 100 }
    }
  }

  if (!Array.isArray(raw) || raw.length === 0)
    return { variants: { options: [], items: [] }, totalStock: 100 }

  const variants: any[] = []
  let totalStock = 0
  const variantNames: Set<string> = new Set()

  for (const v of raw) {
    const sellPrice = parsePrice(
      v.variantSellPrice || v.sellPrice || 0
    )

    if (sellPrice <= 0) continue

    const costPrice = sellPrice * 0.7
    const price = applyMarkup(costPrice)

    let stock = Number(v.variantStock || 0)

    if (stock <= 0) stock = 100

    totalStock += stock

    const options: Record<string, string> = {}

    if (v.variantKey) {
      v.variantKey.split(";").forEach((part: string) => {
        const [name, value] = part.split("-").map((s: string) => s.trim())

        if (name && value) {
          options[name] = value
          variantNames.add(name)
        }
      })
    }

    variants.push({
      id: v.vid,
      sku: v.variantSku || v.vid,
      name:
        Object.entries(options)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ") || `Variant ${variants.length + 1}`,
      price,
      costPrice,
      stock,
      image: v.variantImage,
      options,
    })
  }

  if (totalStock <= 0) totalStock = 100

  return {
    variants: {
      options: Array.from(variantNames),
      items: variants,
    },
    totalStock,
  }
}

/* ------------------------------------------------ */
/* SAVE PRODUCT */
/* ------------------------------------------------ */

async function saveProduct(product: any, keyword?: string) {
  const pid = product.id || product.pid

  if (!pid) return null

  const detail = await fetchProductDetail(String(pid))

  if (!detail) return null

  const sellPrice = parsePrice(detail.sellPrice || product.sellPrice)

  if (sellPrice <= 0) return null

  const costPrice = sellPrice * 0.7

  let price = applyMarkup(costPrice)

  const compareAtPrice =
    sellPrice > price ? sellPrice : price * 1.3

  const images = extractImages(product, detail)

  if (images.length === 0) return null

  const category = mapCategory(
    detail.categoryName || product.threeCategoryName,
    keyword
  )

  const tags = ["verified"]

  if (category !== "general") tags.push(category)

  if (keyword) tags.push(keyword.toLowerCase())

  const { variants, totalStock } = extractVariants(detail)

  let stock = totalStock > 0 ? totalStock : 100

  const data = {
    externalId: String(pid),

    title: (detail.productNameEn || product.nameEn || "Untitled").substring(0, 200),

    description: (
      detail.description ||
      product.description ||
      detail.productNameEn ||
      ""
    ).substring(0, 1000),

    price,
    costPrice,
    compareAtPrice,

    images,

    category,

    tags: [...new Set(tags)],

    rating: +(Math.random() * 0.7 + 4.3).toFixed(1),

    reviewCount: Math.floor(Math.random() * 450 + 50),

    source: "cj",

    isActive: true,

    stock,

    variants,
  }

  return await prisma.product.upsert({
    where: { externalId: String(pid) },
    update: data,
    create: data,
  })
}

/* ------------------------------------------------ */
/* INGESTION ENDPOINT */
/* ------------------------------------------------ */

export async function POST(req: NextRequest) {
  const start = Date.now()

  try {
    const key = req.headers.get("x-api-key")

    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )

    const body = await req.json()

    const keyword = body.keyword

    const count = Math.min(body.count || 5, 20)

    const products = await fetchCJProducts(keyword, count)

    let created = 0
    let updated = 0

    const errors: string[] = []

    for (const p of products) {
      try {
        const existing = await prisma.product.findUnique({
          where: {
            externalId: String(p.id || p.pid),
          },
        })

        const result = await saveProduct(p, keyword)

        if (result) {
          if (existing) updated++
          else created++
        }
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
        errors: errors.length > 0 ? errors.join("\n") : null,
      },
    })

    return NextResponse.json({
      success: true,
      created,
      updated,
      totalFetched: products.length,
      errors,
      time: `${Date.now() - start}ms`,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
  }
