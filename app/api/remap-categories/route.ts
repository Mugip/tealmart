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

const BATCH_SIZE = 20

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// Auto-generate slug from display name
function toSlug(displayName: string) {
  return displayName.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-")
}

async function cjFetch(url: string) {
  const token = await getCJToken()

  const res = await fetch(url, {
    headers: { "CJ-Access-Token": token },
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
    const maxProducts = body.count || 500
    const dryRun = body.dryRun === true

    console.log(`🔄 Starting CJ category remap (max ${maxProducts})`)

    let offset = 0
    let processed = 0
    let updated = 0
    let unchanged = 0
    let errors = 0
    const changes: any[] = []

    while (processed < maxProducts) {
      console.log(`📦 Fetching batch offset ${offset}`)

      const products = await prisma.product.findMany({
        select: {
          id: true,
          externalId: true,
          title: true,
          description: true,
          category: true,
          displayCategory: true,
          slugCategory: true,
        },
        where: {
          externalId: { not: null },
          source: "cj-dropshipping",
        },
        skip: offset,
        take: BATCH_SIZE,
      })

      if (!products.length) break

      for (const product of products) {
        try {
          if (!product.externalId) {
            unchanged++
            processed++
            continue
          }

          console.log(`🔎 Checking ${product.externalId}`)

          const cjData = await cjFetch(
            `${CJ_API_URL}/product/query?pid=${product.externalId}`
          )
          const detail = cjData.data
          const cjCategory =
            detail?.categoryName || detail?.threeCategoryName || ""

          if (!cjCategory) {
            unchanged++
            processed++
            continue
          }

          const newCategory = classifyProduct(
            product.title,
            product.description,
            cjCategory
          )

          // Set displayCategory (for UI) and slugCategory (for URLs)
          const displayCategory = newCategory
          const slugCategory = toSlug(displayCategory)

          const hasChange =
            displayCategory !== product.displayCategory ||
            slugCategory !== product.slugCategory

          if (hasChange) {
            if (!dryRun) {
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  category: newCategory,
                  displayCategory,
                  slugCategory,
                },
              })
            }

            updated++
            if (changes.length < 50) {
              changes.push({
                productId: product.id,
                title: product.title.substring(0, 60),
                oldCategory: product.category,
                newCategory,
                displayCategory,
                slugCategory,
                cjCategory,
              })
            }

            console.log(`✏️ ${product.category} → ${displayCategory} (${slugCategory})`)
          } else {
            unchanged++
          }

          processed++
          await sleep(1100)
          if (processed >= maxProducts) break
        } catch (err) {
          console.error(`❌ Error processing ${product.id}`, err)
          errors++
          processed++
        }
      }

      offset += BATCH_SIZE
    }

    const duration = Date.now() - startTime

    console.log(`✅ Remap complete`)
    console.log(`Processed: ${processed}, Updated: ${updated}, Unchanged: ${unchanged}`)

    return NextResponse.json({
      success: true,
      stats: { processed, updated, unchanged, errors },
      preview: changes,
      time: `${duration}ms`,
    })
  } catch (error: any) {
    console.error("❌ remap-categories error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
      }
