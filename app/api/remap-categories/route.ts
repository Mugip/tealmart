import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"
import { classifyProduct } from "@/lib/productClassifier"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

const INGESTION_API_KEY = process.env.INGESTION_API_KEY!
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function cjFetch(url: string) {
  const token = await getCJToken()

  const res = await fetch(url, {
    headers: {
      "CJ-Access-Token": token,
    },
  })

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error(`CJ API error: ${data.message || data.code}`)
  }

  return data
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const key = req.headers.get("x-api-key")

    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const limit = body.limit || 20
    const offset = body.offset || 0
    const dryRun = body.dryRun === true

    console.log("🔄 Starting CJ category remap...")

    const products = await prisma.product.findMany({
      select: {
        id: true,
        externalId: true,
        title: true,
        description: true,
        category: true,
      },
      where: {
        externalId: {
          not: null,
        },
        source: "cj-dropshipping",
      },
      skip: offset,
      take: limit,
    })

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No products found",
      })
    }

    let updated = 0
    let unchanged = 0
    let errors = 0

    const changes: any[] = []

    for (const product of products) {
      try {
        if (!product.externalId) {
          unchanged++
          continue
        }

        console.log(`🔎 Fetching CJ data for ${product.externalId}`)

        const cjData = await cjFetch(
          `${CJ_API_URL}/product/query?pid=${product.externalId}`
        )

        const detail = cjData.data

        if (!detail) {
          unchanged++
          continue
        }

        const cjCategory =
          detail.categoryName ||
          detail.threeCategoryName ||
          ""

        if (!cjCategory) {
          unchanged++
          continue
        }

        const newCategory = classifyProduct(
          product.title,
          product.description,
          cjCategory
        )

        if (newCategory !== product.category) {
          if (!dryRun) {
            await prisma.product.update({
              where: { id: product.id },
              data: { category: newCategory },
            })
          }

          updated++

          changes.push({
            productId: product.id,
            title: product.title.substring(0, 60),
            oldCategory: product.category,
            newCategory,
            cjCategory,
          })

          console.log(
            `✏️ ${product.category} → ${newCategory} | ${product.title}`
          )
        } else {
          unchanged++
        }

        await sleep(1100)
      } catch (err) {
        console.error(`❌ Error processing ${product.id}`, err)
        errors++
      }
    }

    const duration = Date.now() - startTime

    console.log(`✅ Remap finished in ${duration}ms`)
    console.log(`Updated: ${updated} | Unchanged: ${unchanged}`)

    return NextResponse.json({
      success: true,
      stats: {
        processed: products.length,
        updated,
        unchanged,
        errors,
      },
      preview: changes.slice(0, 50),
      nextOffset: offset + limit,
      hasMore: products.length === limit,
      processingTimeMs: duration,
    })
  } catch (error: any) {
    console.error("❌ remap-categories error:", error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
  }
