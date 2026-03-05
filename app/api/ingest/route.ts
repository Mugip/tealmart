import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

/* =========================
MARKUP ENGINE
========================= */

function applyMarkup(cost: number) {

  if (!cost) return 0

  if (cost < 5) return +(cost * 3).toFixed(2)
  if (cost < 15) return +(cost * 2.2).toFixed(2)
  if (cost < 50) return +(cost * 1.8).toFixed(2)

  return +(cost * 1.5).toFixed(2)
}

/* =========================
FETCH PRODUCT LIST
========================= */

async function fetchCJProducts(keyword?: string, count = 10) {

  const token = await getCJToken()

  const params = new URLSearchParams({
    pageNum: "1",
    pageSize: String(Math.min(count, 10))
  })

  if (keyword) params.append("keyword", keyword)

  const res = await fetch(
    `${CJ_API_URL}/product/list?${params.toString()}`,
    {
      headers: {
        "CJ-Access-Token": token
      }
    }
  )

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error("CJ product list error: " + JSON.stringify(data))
  }

  return data.data?.content?.productList ?? []
}

/* =========================
FETCH PRODUCT DETAIL
========================= */

async function fetchProductDetail(pid: string) {

  const token = await getCJToken()

  const res = await fetch(
    `${CJ_API_URL}/product/query?pid=${pid}`,
    {
      headers: {
        "CJ-Access-Token": token
      }
    }
  )

  const data = await res.json()

  if (data.code !== 200) return null

  return data.data
}

/* =========================
IMAGE PARSER
========================= */

function parseImages(value: any): string[] {

  if (!value) return []

  if (Array.isArray(value)) return value

  if (typeof value === "string") {

    try {

      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) return parsed

    } catch {}

    return [value]
  }

  return []
}

function extractImages(detail: any): string[] {

  const images = [
    ...parseImages(detail.productImage),
    ...parseImages(detail.productImageList)
  ]

  const cleaned = images.filter(
    (img) => typeof img === "string" && img.startsWith("http")
  )

  return [...new Set(cleaned)]
}

/* =========================
VARIANT PARSER
========================= */

function extractVariants(detail: any) {

  if (!detail.variants) {
    return { variants: [], stock: 0, cost: 0 }
  }

  let raw = detail.variants

  if (typeof raw === "string") {

    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: [], stock: 0, cost: 0 }
    }
  }

  if (!Array.isArray(raw)) {
    return { variants: [], stock: 0, cost: 0 }
  }

  const variants: any[] = []

  let totalStock = 0
  let cheapestCost = Number.MAX_VALUE

  for (const v of raw) {

    const cost = Number(v.variantSellPrice || v.sellPrice || 0)

    const price = applyMarkup(cost)

    const stock = Number(v.variantStock || 0)

    totalStock += stock

    if (cost < cheapestCost) cheapestCost = cost

    variants.push({
      id: v.vid,
      price,
      cost,
      stock,
      image: v.variantImage,
      key: v.variantKey
    })
  }

  return {
    variants,
    stock: totalStock,
    cost: cheapestCost === Number.MAX_VALUE ? 0 : cheapestCost
  }
}

/* =========================
SAVE PRODUCT
========================= */

async function saveProduct(detail: any) {

  const pid = detail.pid

  if (!pid) return "skip"

  const images = extractImages(detail)

  const { variants, stock, cost } = extractVariants(detail)

  let price = applyMarkup(cost)

  if (variants.length > 0) {
    price = Math.min(...variants.map((v) => v.price))
  }

  const data = {
    externalId: pid,
    title: detail.productNameEn || "Untitled",
    description: detail.description || "",
    price,
    costPrice: cost,
    compareAtPrice: +(price * 1.3).toFixed(2),
    images,
    category: detail.categoryName || "general",
    tags: [],
    source: "CJ",
    stock,
    variants
  }

  const existing = await prisma.product.findUnique({
    where: { externalId: pid }
  })

  if (!existing) {

    await prisma.product.create({ data })

    return "created"
  }

  await prisma.product.update({
    where: { externalId: pid },
    data
  })

  return "updated"
}

/* =========================
API ROUTE
========================= */

export async function POST(req: NextRequest) {

  const start = Date.now()

  try {

    const key = req.headers.get("x-api-key")

    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const keyword = body.keyword
    const count = body.count || 5

    const list = await fetchCJProducts(keyword, count)

    let created = 0
    let updated = 0

    for (const p of list) {

      const detail = await fetchProductDetail(p.id)

      if (!detail) continue

      const result = await saveProduct(detail)

      if (result === "created") created++
      if (result === "updated") updated++

      // prevent API rate limits
      await new Promise((r) => setTimeout(r, 1000))
    }

    await prisma.ingestionLog.create({
      data: {
        source: "CJ",
        productsAdded: created,
        productsUpdated: updated,
        status: "SUCCESS"
      }
    })

    return NextResponse.json({
      success: true,
      created,
      updated,
      time: Date.now() - start
    })

  } catch (err: any) {

    await prisma.ingestionLog.create({
      data: {
        source: "CJ",
        status: "FAILED",
        errors: err.message
      }
    })

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
    }
