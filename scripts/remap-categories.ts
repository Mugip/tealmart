// scripts/remap-categories.ts
import { PrismaClient } from '@prisma/client'
import { classifyProduct } from '../lib/productClassifier'

const prisma = new PrismaClient()

async function remapAllCategories() {
  console.log('🔄 Starting category remapping...\n')

  const startTime = Date.now()

  try {
    // Fetch all products
    console.log('📥 Fetching all products from database...')
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
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

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      
      // Show progress every 10 products
      if ((i + 1) % 10 === 0) {
        console.log(`📊 Progress: ${i + 1}/${products.length}`)
      }

      try {
        // Classify with the new classifier (ADDED AWAIT!)
        const newCategory = classifyProduct(
          product.title,
          product.description,
          product.category
        )

        if (newCategory !== product.category) {
          // Update the product
          await prisma.product.update({
            where: { id: product.id },
            data: { category: newCategory },
          })

          // Track the change
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
          console.log(`✏️  Updated: "${product.title.substring(0, 50)}..."`)
          console.log(`   ${product.category} → ${newCategory}`)
        } else {
          unchanged++
        }
      } catch (error: any) {
        console.error(`❌ Error processing product ${product.id}:`, error.message)
        errors++
      }
    }

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    // Print summary
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

    // Show new category distribution
    console.log('\n📊 NEW CATEGORY DISTRIBUTION:')
    console.log('-'.repeat(60))
    
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

    for (const stat of categoryStats) {
      const percentage = ((stat._count.id / products.length) * 100).toFixed(1)
      console.log(
        `${stat.category.padEnd(20)} ${stat._count.id.toString().padStart(5)} (${percentage}%)`
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

// Run the script
remapAllCategories()
  .then(() => {
    console.log('\n🎉 Script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
