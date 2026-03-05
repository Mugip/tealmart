// app/api/ingest/debug/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCJToken } from "@/lib/cjToken"

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

export async function POST(req: NextRequest) {
  try {
    const key = req.headers.get("x-api-key")
    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const pid = body.productId || "1392297099323904000"

    console.log("🔍 Debug mode - fetching product:", pid)

    // Step 1: Get token
    const token = await getCJToken()
    console.log("✅ Token obtained")

    // Step 2: Fetch product detail
    const res = await fetch(
      `${CJ_API_URL}/product/query?pid=${pid}`,
      { headers: { "CJ-Access-Token": token } }
    )

    const data = await res.json()
    
    if (data.code !== 200) {
      return NextResponse.json({
        error: "CJ API error",
        response: data
      }, { status: 400 })
    }

    const detail = data.data

    // Step 3: Show what we would save
    const result = {
      productId: pid,
      apiResponse: {
        code: data.code,
        message: data.message,
        productFound: !!detail
      },
      productData: {
        pid: detail.pid,
        title: detail.productNameEn,
        description: detail.description?.substring(0, 200) + "...",
        sellPrice: detail.sellPrice,
        categoryName: detail.categoryName,
        images: detail.productImageList,
        hasVariants: !!detail.variants,
        variantCount: Array.isArray(detail.variants) ? detail.variants.length : 0
      },
      rawVariants: detail.variants,
      whatWouldBeSaved: {
        externalId: String(detail.pid),
        title: detail.productNameEn,
        price: "(calculated)",
        images: Array.isArray(detail.productImageList) ? detail.productImageList.slice(0, 5) : [],
        variants: detail.variants,
        note: "This is what would be saved to database"
      }
    }

    return NextResponse.json(result, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
