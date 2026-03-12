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

    console.log('🔄 Starting category remapping...')

    // Get optional parameters
    const body = await req.json().catch(() => ({}))
    const limit = body.limit // Optional: limit number of products to remap
    const dryRun = body.dryRun === true // Optional: preview changes without updating

    // Fetch products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
      ...(limit ? { take: limit } : {}),
    })

    console.log(`✅ Found ${products.length} products`)

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
      })
    }

    let updated = 0
    let unchanged = 0
    let errors = 0

    const categoryChanges: Array<{
      productId: string
      title: string
      from: string
      to: string
    }> = []

    const changeSummary: Record<string, number> = {}

    // Process each product
    for (const product of products) {
      try {
        // Classify with the new classifier
        const newCategory = await classifyProduct(
          product.title,
          product.description,
          product.category
        )

        if (newCategory !== product.category) {
          if (!dryRun) {
            // Actually update the database
            await prisma.product.update({
              where: { id: product.id },
              data: { category: newCategory },
            })
          }

          categoryChanges.push({
            productId: product.id,
            title: product.title.substring(0, 60),
            from: product.category,
            to: newCategory,
          })

          const changeKey = `${product.category} → ${newCategory}`
          changeSummary[changeKey] = (changeSummary[changeKey] || 0) + 1

          updated++
          console.log(`✏️  ${product.category} → ${newCategory}: ${product.title.substring(0, 50)}`)
        } else {
          unchanged++
        }
      } catch (error: any) {
        console.error(`❌ Error processing product ${product.id}:`, error.message)
        errors++
      }
    }

    // Get new category distribution
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
      percentage: ((stat._count.id / products.length) * 100).toFixed(1),
    }))

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Remapping complete: ${updated} updated, ${unchanged} unchanged, ${errors} errors`)

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        total: products.length,
        updated,
        unchanged,
        errors,
        duration: `${duration}s`,
      },
      changes: categoryChanges.slice(0, 100), // First 50 changes for preview
      changeSummary,
      categoryDistribution,
      message: dryRun
        ? `Preview: ${updated} products would be updated`
        : `Successfully remapped ${updated} products`,
    })
  } catch (error: any) {
    console.error('❌ Remapping error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remap categories' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
