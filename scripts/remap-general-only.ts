// scripts/remap-general-only.ts
import { PrismaClient } from '@prisma/client'
import { classifyProduct, getClassifierHealth } from '../lib/productClassifier'

const prisma = new PrismaClient()

async function remapGeneralCategories() {
  console.log('🚀 Starting Targeted Remapping for "General" Category...')
  console.log('🧠 AI Layer:', process.env.HUGGINGFACE_API_KEY ? 'ENABLED' : 'DISABLED (Heuristics Only)')
  console.log('--------------------------------------------\n')

  try {
    // 1. Fetch ONLY products currently stuck in "General" or "general"
    const products = await prisma.product.findMany({
      where: {
        category: {
          in: ['General', 'general', 'Uncategorized', '']
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    })

    const total = products.length;
    if (total === 0) {
      console.log('🎉 No products found in the "General" category! You are all set.')
      return;
    }

    console.log(`✅ Found ${total} products stuck in "General" to analyze.\n`)

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      
      if (i % 10 === 0 && i !== 0) {
        const health = getClassifierHealth();
        console.log(`⏳ Progress: ${i}/${total} | AI Health: ${health.status}`);
      }

      const newCategory = await classifyProduct(
        product.title,
        product.description,
        product.category 
      )

      // ✅ FIXED: Removed the lowercase 'general' check to satisfy TypeScript
      if (newCategory !== 'General' && newCategory !== product.category) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory },
        })
        
        updated++
        console.log(`✨ [FIXED] ${product.title.substring(0, 45)}...`)
        console.log(`   [${product.category}] → [${newCategory}]`)
      } else {
        skipped++
      }

      if (process.env.HUGGINGFACE_API_KEY) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    console.log('\n--------------------------------------------')
    console.log('🎉 Targeted Remapping Complete!')
    console.log(`📊 Total Processed: ${total}`)
    console.log(`✅ Successfully Rescued: ${updated}`)
    console.log(`😴 Remained General: ${skipped}`)
    console.log('--------------------------------------------')

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

remapGeneralCategories()
