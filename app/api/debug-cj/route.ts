// app/api/debug-cj/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getCJToken } from "@/lib/cjToken"

const prisma = new PrismaClient()
const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

async function testProductInCJ(pid: string, token: string) {
  try {
    const response = await fetch(`${CJ_API_URL}/product/query?pid=${pid}`, {
      headers: { "CJ-Access-Token": token }
    })
    
    const data = await response.json()
    
    return {
      pid,
      exists: data.code === 200,
      response: data,
      hasVariants: data.data?.variants ? true : false,
      variantCount: Array.isArray(data.data?.variants) ? data.data.variants.length : 0,
      firstVariant: Array.isArray(data.data?.variants) && data.data.variants.length > 0 
        ? data.data.variants[0] 
        : null,
    }
  } catch (error: any) {
    return {
      pid,
      exists: false,
      error: error.message,
    }
  }
}

async function testCreateOrder(pid: string, vid: string, token: string) {
  try {
    const payload = {
      orderNumber: `TEST-${Date.now()}`,
      shippingZip: "85210",
      shippingCountry: "United States",
      shippingCountryCode: "US",
      shippingProvince: "Arizona",
      shippingCity: "Mesa",
      shippingPhone: "+1234567890",
      shippingCustomerName: "Test User",
      shippingAddress: "123 Test Street",
      remark: "Test Order",
      logisticName: "YunExpress",
      fromCountryCode: "CN",
      products: [
        {
          vid: vid,
          quantity: 1,
        }
      ],
    }

    const response = await fetch(`${CJ_API_URL}/shopping/order/createOrderV2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    return {
      canOrder: data.code === 200 || data.result === true,
      response: data,
    }
  } catch (error: any) {
    return {
      canOrder: false,
      error: error.message,
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const key = req.headers.get("x-api-key")
    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = await getCJToken()
    
    console.log("🔍 Starting CJ Product Debug...")

    // Get recent products from database
    const products = await prisma.product.findMany({
      where: {
        source: "cj-dropshipping",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        externalId: true,
        title: true,
        variants: true,
        createdAt: true,
      },
    })

    console.log(`📦 Found ${products.length} products in database`)

    const results = []

    for (const product of products) {
      console.log(`\n🔍 Testing product: ${product.externalId}`)
      
      // Test if product exists in CJ
      const productTest = await testProductInCJ(product.externalId!, token)
      
      // Extract VID to test
      let testVid = product.externalId // Default to PID
      let vidSource = "product PID"
      
      if (productTest.exists && productTest.firstVariant) {
        // Try to get VID from CJ's response
        testVid = productTest.firstVariant.vid || 
                  productTest.firstVariant.variantId || 
                  productTest.firstVariant.id ||
                  productTest.firstVariant.sku ||
                  product.externalId
        vidSource = "CJ variant data"
      } else if (product.variants && typeof product.variants === 'object') {
        // Try to get VID from database
        const dbVariants = product.variants as any
        if (dbVariants.items && Array.isArray(dbVariants.items) && dbVariants.items.length > 0) {
          testVid = dbVariants.items[0].sku || dbVariants.items[0].id
          vidSource = "database variant"
        }
      }

      console.log(`🎯 Testing VID: ${testVid} (from ${vidSource})`)

      // Test if we can create an order
      const orderTest = await testCreateOrder(product.externalId!, testVid!, token)

      results.push({
        databaseProduct: {
          id: product.id,
          externalId: product.externalId,
          title: product.title,
          hasVariantsInDB: !!product.variants,
          dbVariants: product.variants,
          createdAt: product.createdAt,
        },
        cjProductQuery: productTest,
        vidUsedForTest: testVid,
        vidSource: vidSource,
        orderTest: orderTest,
        conclusion: {
          productExistsInCJ: productTest.exists,
          canBeOrdered: orderTest.canOrder,
          issue: !orderTest.canOrder ? orderTest.response?.message || "Unknown error" : null,
        }
      })

      // Rate limit
      await new Promise(r => setTimeout(r, 1500))
    }

    // Summary
    const summary = {
      totalTested: results.length,
      existInCJ: results.filter(r => r.conclusion.productExistsInCJ).length,
      canBeOrdered: results.filter(r => r.conclusion.canBeOrdered).length,
      cannotBeOrdered: results.filter(r => !r.conclusion.canBeOrdered).length,
      commonIssues: results
        .filter(r => !r.conclusion.canBeOrdered)
        .map(r => r.conclusion.issue)
        .reduce((acc, issue) => {
          if (issue) {
            acc[issue] = (acc[issue] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>),
    }

    return NextResponse.json({
      summary,
      detailedResults: results,
      recommendations: generateRecommendations(summary, results),
    }, { status: 200 })

  } catch (error: any) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

function generateRecommendations(summary: any, results: any[]) {
  const recommendations = []

  if (summary.canBeOrdered === 0) {
    recommendations.push("🚨 CRITICAL: None of your products can be ordered via CJ API")
    recommendations.push("❗ Your CJ account is likely NOT VERIFIED for API orders")
    recommendations.push("📞 Contact CJ support via online chat: https://www.cjdropshipping.com/")
    recommendations.push("📋 Ask them to verify your account for API/dropshipping orders")
  }

  if (summary.existInCJ > 0 && summary.canBeOrdered === 0) {
    recommendations.push("⚠️ Products exist in CJ but cannot be ordered")
    recommendations.push("Possible reasons:")
    recommendations.push("  1. Account not verified")
    recommendations.push("  2. Products not available in your region")
    recommendations.push("  3. Insufficient account balance")
    recommendations.push("  4. Products discontinued")
  }

  const invalidProductCount = Object.values(summary.commonIssues).reduce((a: any, b: any) => a + b, 0) as number
  if (invalidProductCount > 0) {
    recommendations.push(`❌ Common error: ${Object.keys(summary.commonIssues)[0]}`)
  }

  // Check if variants are missing
  const missingVariants = results.filter(r => 
    r.cjProductQuery.hasVariants && !r.databaseProduct.hasVariantsInDB
  ).length

  if (missingVariants > 0) {
    recommendations.push(`⚠️ ${missingVariants} products have variants in CJ but not saved in database`)
    recommendations.push("Re-run ingestion to fetch variants properly")
  }

  return recommendations
}
