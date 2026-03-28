// scripts/remap-categories.ts
import { PrismaClient } from '@prisma/client'
import { classifyProductSync } from '../lib/productClassifier'

const prisma = new PrismaClient()

async function remapAllCategories() {
  console.log('🔄 Starting Advanced Category Remapping...\n')

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    })

    console.log(`✅ Found ${products.length} products to analyze.\n`)

    let updated = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      // We pass the title and a snippet of the description to the advanced heuristic engine.
      const newCategory = classifyProductSync(
        product.title,
        product.description
      )

      // If the engine thinks the category should change, we update the DB.
      if (newCategory !== product.category) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory },
        })
        updated++
        console.log(`✨ FIXED: ${product.title.substring(0, 45)}... | [${product.category}] → [${newCategory}]`)
      }
    }

    console.log(`\n🎉 Remapping complete! Successfully corrected ${updated} products.`)
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

remapAllCategories()
