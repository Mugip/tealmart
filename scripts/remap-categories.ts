// scripts/remap-categories.ts
import { PrismaClient } from '@prisma/client'
import { classifyProductSync } from '../lib/productClassifier'

// Use the synchronous classifier for bulk remap — avoids Gemini API limits
// (1,500/day free tier would be exhausted instantly on a large catalog).
// For individual ambiguous products, the async classifyProduct() with Gemini
// is used automatically during normal ingestion.

const prisma = new PrismaClient()

async function remapAllCategories() {
  console.log('🔄 Starting category remapping...\n')
  console.log('ℹ️  Using synchronous classifier (keyword + CJ map, no AI)')
  console.log('    To force Gemini on ambiguous products, re-ingest them instead.\n')

  const startTime = Date.now()

  try {
    console.log('📥 Fetching all products from database...')
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
      },
    })

    console.log(`✅ Found ${products.length} products\n`)

    if (products.length === 0) {
      console.log('⚠️  No products found in database')
      return
    }

    let updated = 0
    let unchanged = 0
    let errors = 0

    const categoryChanges: Record<string, { from: string; to: string; count: number }> = {}

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      if ((i + 1) % 50 === 0 || i === 0) {
        console.log(`📊 Progress: ${i + 1}/${products.length}`)
      }

      try {
        // Extract the CJ source category from tags if available
        // Tags are stored as e.g. ["tealmart", "Women's Clothing", "women blouse"]
        // The category tag is the canonical category stored during ingestion.
        // We pass product.category as the cjCategory hint since that's what was
        // originally stored from the CJ API during ingestion.
        const newCategory = classifyProductSync(
          product.title,
          product.description,
          product.category // use stored category as CJ hint for migration
        )

        if (newCategory !== product.category) {
          await prisma.product.update({
            where: { id: product.id },
            data: { category: newCategory },
          })

          const changeKey = `${product.category} → ${newCategory}`
          if (!categoryChanges[changeKey]) {
            categoryChanges[changeKey] = {
              from: product.category,
              to: newCategory,
              count: 0,
            }
          }
          categoryChanges[changeKey].count++
          updated++

          if (updated <= 20) {
            // Only log first 20 individual changes to avoid flooding terminal
            console.log(`✏️  "${product.title.substring(0, 50)}"`)
            console.log(`   ${product.category} → ${newCategory}`)
          }
        } else {
          unchanged++
        }
      } catch (error: any) {
        console.error(`❌ Error processing product ${product.id}:`, error.message)
        errors++
      }
    }

    if (updated > 20) {
      console.log(`   ... and ${updated - 20} more changes (see summary below)`)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('📊 REMAPPING SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total products:     ${products.length}`)
    console.log(`✅ Updated:         ${updated}`)
    console.log(`⚪ Unchanged:       ${unchanged}`)
    console.log(`❌ Errors:          ${errors}`)
    console.log(`⏱️  Duration:        ${duration}s`)
    console.log('='.repeat(60))

    if (Object.keys(categoryChanges).length > 0) {
      console.log('\n📈 CATEGORY CHANGES:')
      console.log('-'.repeat(60))
      const sortedChanges = Object.entries(categoryChanges).sort(
        (a, b) => b[1].count - a[1].count
      )
      for (const [changeKey, data] of sortedChanges) {
        console.log(`${data.count.toString().padStart(4)}x  ${changeKey}`)
      }
      console.log('-'.repeat(60))
    }

    console.log('\n📊 NEW CATEGORY DISTRIBUTION:')
    console.log('-'.repeat(60))

    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    for (const stat of categoryStats) {
      const percentage = ((stat._count.id / products.length) * 100).toFixed(1)
      console.log(
        `${stat.category.padEnd(25)} ${stat._count.id.toString().padStart(5)} (${percentage}%)`
      )
    }
    console.log('-'.repeat(60))

    console.log('\n✅ Remapping complete!')
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

remapAllCategories()
  .then(() => {
    console.log('\n🎉 Script finished successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
