// app/api/remap-categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { classifyProduct } from '@/lib/productClassifier'

const prisma = new PrismaClient()
const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Authentication
    const key = req.headers.get('x-api-key')
    if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting category normalization...')

    // Get optional parameters
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 100 // Process in batches
    const dryRun = body.dryRun === true // Preview changes without updating
    const offset = body.offset || 0 // For pagination

    // Fetch products to remap
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
      skip: offset,
      take: limit,
    })

    console.log(`✅ Found ${products.length} products to normalize`)

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found',
        stats: {
          total: 0,
          updated: 0,
          unchanged: 0,
          errors: 0,
        },
        nextOffset: offset,
      })
    }

    let updated = 0
    let unchanged = 0
    let errors = 0

    const categoryChanges: Array<{
      productId: string
      title: string
      oldCategory: string
      newCategory: string
    }> = []

    const changeSummary: Record<string, number> = {}

    // Process each product
    for (const product of products) {
      try {
        // Key insight: Treat the current category as if it were a CJ-style category
        // by passing it to classifyProduct. The classifier will:
        // 1. Extract the first part if it's hierarchical (e.g., "home-and-garden" stays as-is)
        // 2. Normalize spaces, dashes, special characters
        // 3. Standardize possessives (women's → womens)
        // 4. Create a consistent slug format
        
        const newCategory = classifyProduct(
          product.title,
          product.description,
          product.category // Use existing category as source
        )

        if (newCategory !== product.category) {
          if (!dryRun) {
            await prisma.product.update({
              where: { id: product.id },
              data: { category: newCategory },
            })
          }

          categoryChanges.push({
            productId: product.id,
            title: product.title.substring(0, 60),
            oldCategory: product.category,
            newCategory,
          })

          const changeKey = `${product.category} → ${newCategory}`
          changeSummary[changeKey] = (changeSummary[changeKey] || 0) + 1

          updated++
          console.log(
            `✏️  "${product.category}" → "${newCategory}" | ${product.title.substring(0, 50)}`
          )
        } else {
          unchanged++
        }
      } catch (error: any) {
        console.error(`❌ Error processing product ${product.id}:`, error.message)
        errors++
      }
    }

    // Get current category distribution
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    const categoryDistribution = categoryStats.map((stat) => ({
      category: stat.category,
      count: stat._count.id,
    }))

    const duration = Date.now() - startTime

    console.log(`✅ Processed ${products.length} products in ${duration}ms`)
    console.log(
      `📊 Updated: ${updated}, Unchanged: ${unchanged}, Errors: ${errors}`
    )

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run: ${updated} categories would be updated` 
        : `Successfully normalized ${updated} categories`,
      dryRun,
      stats: {
        total: products.length,
        updated,
        unchanged,
        errors,
      },
      categoryDistribution,
      categoryChanges: categoryChanges.slice(0, 50), // Return first 50 for preview
      changeSummary,
      processingTimeMs: duration,
      // For pagination - use this offset for the next batch
      nextOffset: offset + limit,
      hasMore: products.length === limit, // Will be true if there might be more
    })
  } catch (error: any) {
    console.error('❌ Error in remap-categories:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
