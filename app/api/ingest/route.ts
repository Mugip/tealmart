import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

/* =========================
MARKUP
========================= */

function applyMarkup(cost: number) {

  if (!cost || cost <= 0) return 0

  if (cost < 5) return +(cost * 3).toFixed(2)
  if (cost < 15) return +(cost * 2.2).toFixed(2)
  if (cost < 50) return +(cost * 1.8).toFixed(2)

  return +(cost * 1.5).toFixed(2)
}

function safeFloat(v: any) {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

/* =========================
CJ PRODUCT LIST (ROBUST)
========================= */

async function fetchCJProducts(keyword?: string, count = 10) {

  const token = await getCJToken()

  const params = new URLSearchParams({
    pageNum: "1",
    pageSize: String(Math.min(count, 10))
  })

  if (keyword) params.append("keyword", keyword)

  const res = await fetch(
    `${CJ_API_URL}/product/list?${params}`,
    {
      headers: {
        "CJ-Access-Token": token
      }
    }
  )

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error("CJ LIST ERROR: " + JSON.stringify(data))
  }

  const list = data?.data?.content?.productList ?? []

  console.log("CJ fetched:", list.length)

  return list
}

/* =========================
CJ PRODUCT DETAIL
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

  if (data.code !== 200) {

    console.log("DETAIL ERROR", data)

    return null
  }

  return data.data
}

/* =========================
IMAGE EXTRACTION
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

function extractImages(detail: any) {

  const images = [

    ...parseImages(detail.productImage),
    ...parseImages(detail.productImageList),
    ...parseImages(detail.productImageSet)

  ]

  const cleaned = images.filter(
    (img) => typeof img === "string" && img.startsWith("http")
  )

  return [...new Set(cleaned)]
}

/* =========================
VARIANT EXTRACTION
========================= */

function extractVariants(detail: any) {

  let raw = detail.variants

  console.log("VARIANT RAW TYPE:", typeof raw)

  if (!raw) {
    return {
      variants: [],
      options: [],
      stock: 0,
      cost: 0
    }
  }

  if (typeof raw === "string") {

    try {
      raw = JSON.parse(raw)
    } catch {

      console.log("VARIANT PARSE FAILED")

      return {
        variants: [],
        options: [],
        stock: 0,
        cost: 0
      }
    }
  }

  if (!Array.isArray(raw)) {

    console.log("VARIANT NOT ARRAY")

    return {
      variants: [],
      options: [],
      stock: 0,
      cost: 0
    }
  }

  const variants: any[] = []

  const optionGroups: Record<string, Set<string>> = {}

  let totalStock = 0
  let cheapestCost = Number.MAX_VALUE

  for (const v of raw) {

    const cost =
      safeFloat(v.variantSellPrice) ||
      safeFloat(v.sellPrice)

    const price = applyMarkup(cost)

    const stock =
      safeFloat(v.variantStock) ||
      safeFloat(v.stock)

    totalStock += stock

    if (cost < cheapestCost) cheapestCost = cost

    /* =========================
       OPTION PARSING
    ========================= */

    const key = v.variantKey || ""

    const options: Record<string, string> = {}

    for (const part of key.split(";")) {

      if (!part.includes("-")) continue

      const [name, value] = part.split("-")

      const n = name.trim()
      const val = value.trim()

      options[n] = val

      if (!optionGroups[n]) {
        optionGroups[n] = new Set()
      }

      optionGroups[n].add(val)
    }

    variants.push({
      id: v.vid || "",
      price,
      cost,
      stock,
      image: v.variantImage || null,
      options
    })
  }

  const options = Object.entries(optionGroups).map(
    ([name, values]) => ({
      name,
      values: Array.from(values)
    })
  )

  console.log("Variants:", variants.length)
  console.log("Option groups:", options.length)

  return {
    variants,
    options,
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

  const title =
    detail.productNameEn ||
    detail.productName ||
    "Untitled"

  const description = detail.description || ""

  const category = detail.categoryName || "general"

  const images = extractImages(detail)

  const { variants, options, stock, cost } =
    extractVariants(detail)

  let price = applyMarkup(cost)

  if (variants.length) {

    const prices = variants
      .map((v) => v.price)
      .filter((p) => p > 0)

    if (prices.length) {
      price = Math.min(...prices)
    }
  }

  const data = {

    externalId: pid,
    title,
    description,
    price,

    costPrice: cost,

    compareAtPrice: +(price * 1.3).toFixed(2),

    images: images ?? [],

    category,

    tags: [],

    source: "CJ",

    stock,

    variants: variants ?? [],

    options: options ?? []
  }

  console.log("Saving:", title)

  const existing = await prisma.product.findUnique({
    where: { externalId: pid }
  })

  if (!existing) {

    await prisma.product.create({
      data
    })

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

      /* RATE LIMIT PROTECTION */

      await new Promise((r) => setTimeout(r, 1200))
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

    console.error("INGEST ERROR:", err)

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
