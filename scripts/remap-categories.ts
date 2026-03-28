// scripts/remap-categories.ts
import { PrismaClient } from '@prisma/client'
import { classifyProductSync } from '../lib/productClassifier'

const prisma = new PrismaClient()

async function remapAllCategories() {
  console.log('🔄 Starting category remapping...\n')

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    })

    console.log(`✅ Found ${products.length} products to remap\n`)

    let updated = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      // We intentionally DO NOT pass `product.category` here, because it contains the bad data.
      // We force the classifier to read ONLY the title and description.
      const newCategory = classifyProductSync(
        product.title,
        product.description
      )

      if (newCategory !== product.category) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory },
        })
        updated++
        console.log(`✏️  ${product.title.substring(0, 30)}... | ${product.category} → ${newCategory}`)
      }
    }

    console.log(`\n✅ Remapping complete! Successfully fixed ${updated} products.`)
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

remapAllCategories()
