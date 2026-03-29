// scripts/remap-categories.ts
import { PrismaClient } from '@prisma/client'
import { classifyProduct, getClassifierHealth } from '../lib/productClassifier'

const prisma = new PrismaClient()

async function remapAllCategories() {
  console.log('🚀 Starting Top-Notch Category Remapping...')
  console.log('🧠 AI Layer:', process.env.HUGGINGFACE_API_KEY ? 'ENABLED' : 'DISABLED (Heuristics Only)')
  console.log('--------------------------------------------\n')

  try {
    // 1. Fetch all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
      },
    })

    const total = products.length;
    console.log(`✅ Found ${total} products to analyze.\n`)

    let updated = 0;
    let skipped = 0;
    let aiCalls = 0;

    // 2. Process products one-by-one (to handle Async AI calls)
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      
      // Progress indicator every 10 products
      if (i % 10 === 0 && i !== 0) {
        const health = getClassifierHealth();
        console.log(`⏳ Progress: ${i}/${total} | Health: ${health.status}`);
      }

      // Use the NEW Async Classifier
      // It tries Heuristics first, then AI if Heuristics return "General"
      const newCategory = await classifyProduct(
        product.title,
        product.description,
        product.category // Pass current category as a hint
      )

      if (newCategory !== product.category) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory },
        })
        
        updated++
        console.log(`✨ [FIXED] ${product.title.substring(0, 35)}...`)
        console.log(`   [${product.category}] → [${newCategory}]`)
      } else {
        skipped++
      }

      // 3. Prevent Rate Limiting
      // If AI is enabled, add a tiny delay between requests
      if (process.env.HUGGINGFACE_API_KEY) {
        await new Promise(r => setTimeout(r, 200)); 
      }
    }

    console.log('\n--------------------------------------------')
    console.log('🎉 Remapping Complete!')
    console.log(`📊 Total Processed: ${total}`)
    console.log(`✅ Successfully Updated: ${updated}`)
    console.log(`😴 Remained Unchanged: ${skipped}`)
    console.log('--------------------------------------------')

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

remapAllCategories()
