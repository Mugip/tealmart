import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

function applyMarkup(cost: number) {
  if (!cost || cost <= 0) return 0
  if (cost < 5) return +(cost * 3).toFixed(2)
  if (cost < 15) return +(cost * 2.2).toFixed(2)
  if (cost < 50) return +(cost * 1.8).toFixed(2)
  return +(cost * 1.5).toFixed(2)
}

async function fetchCJProducts(keyword?: string, count = 10) {
  const token = await getCJToken()

  let page = 1
  let remaining = count
  const products: any[] = []

  while (remaining > 0) {
    const size = Math.min(remaining, 10)

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    })

    if (keyword) params.append("keyWord", keyword)

    const res = await fetch(
      `${CJ_API_URL}/product/listV2?${params.toString()}`,
      { headers: { "CJ-Access-Token": token } }
    )

    const data = await res.json()
    const content = data?.data?.content

    if (!content || content.length === 0) break

    const list = content[0]?.productList || []
    if (!list.length) break

    products.push(...list)
    remaining -= list.length
    page++
  }

  return products.slice(0, count)
}

async function fetchProductDetail(pid: string) {
  const token = await getCJToken()

  const res = await fetch(
    `${CJ_API_URL}/product/query?pid=${pid}`,
    { headers: { "CJ-Access-Token": token } }
  )

  const data = await res.json()
  if (data.code !== 200) return null
  return data.data
}

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
    ...parseImages(detail.productImageList),
  ]
  const cleaned = images.filter(
    (img) => typeof img === "string" && img.startsWith("http")
  )
  return [...new Set(cleaned)]
}

function extractVariants(detail: any) {
  if (!detail.variants) return { variants: [], stock: 0 }

  let raw = detail.variants
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { variants: [], stock: 0 }
    }
  }
  if (!Array.isArray(raw)) return { variants: [], stock: 0 }

  const variants: any[] = []
  let stock = 0

  for (const v of raw) {
    const key = v.variantKey || ""
    const options: any = {}

    key.split(";").forEach((part: string) => {
      if (!part.includes("-")) return
      const [name, value] = part.split("-", 1)
      if (!name || !value) return
      options[name] = value
    })

    const cost = Number(v.variantSellPrice || v.sellPrice || 0)
    const price = applyMarkup(cost)
    const s = Number(v.variantStock || 0)
    stock += s

    variants.push({
      id: v.vid,
      price,
      stock: s,
      image: v.variantImage,
      options,
    })
  }

  return { variants, stock }
}

async function saveProduct(detail: any) {
  const pid = detail.pid
  if (!pid) return "skip"

  const images = extractImages(detail)
  const { variants, stock } = extractVariants(detail)

  let price = 0
  if (variants.length > 0) {
    price = Math.min(...variants.map((v) => v.price))
  }

  const data = {
    externalId: pid,
    title: detail.productNameEn || "Untitled",
    description: detail.description || "",
    price,
    images,
    category: detail.categoryName || "general",
    variants,
    source: "CJ",
    stock,
  }

  await prisma.product.upsert({
    where: { externalId: pid },
    update: data,
    create: data,
  })

  return "saved"
}

async function logIngest(status: string, added = 0, updated = 0, error?: string) {
  try {
    await prisma.ingestionLog.create({
      data: {
        source: "CJ",
        productsAdded: added,
        productsUpdated: updated,
        status,
        errors: error,
      },
    })
  } catch (e) {
    console.error("Log failed", e)
  }
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
    const count = body.count || 5

    const list = await fetchCJProducts(keyword, count)

    let created = 0
    let updated = 0

    for (const p of list) {
      const detail = await fetchProductDetail(p.id)
      if (!detail) continue

      const result = await saveProduct(detail)
      if (result === "saved") {
        const exists = await prisma.product.findUnique({
          where: { externalId: p.id },
        })
        if (exists) updated++
        else created++
      }

      await new Promise((r) => setTimeout(r, 1100))
    }

    await logIngest("SUCCESS", created, updated)

    return NextResponse.json({
      success: true,
      created,
      updated,
      time: Date.now() - start,
    })
  } catch (err: any) {
    await logIngest("FAILED", 0, 0, err.message)

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
  }
