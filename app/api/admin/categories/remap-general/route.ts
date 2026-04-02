// app/api/admin/categories/remap-general/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { classifyProduct, resetAIHealth } from '@/lib/productClassifier'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || !session.permissions.includes('all')) {
    return NextResponse.json({ error: 'Unauthorized. Super Admin only.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = body.dryRun !== false

  // Revive AI before processing
  resetAIHealth();

  try {
    // ✅ Reduced batch size to 15 to stay far away from Free Tier abuse limits
    const products = await prisma.product.findMany({
      where: {
        category: { in: ['General', 'general', 'Uncategorized', ''] }
      },
      select: { id: true, title: true, description: true, category: true },
      take: 15 
    })

    if (products.length === 0) {
      return NextResponse.json({ message: "No 'General' products found! You're all caught up." })
    }

    let updated = 0
    let skipped = 0
    const changes: Array<{ title: string; from: string; to: string }> = []

    for (const product of products) {
      const newCategory = await classifyProduct(product.title, product.description, product.category)

      if (newCategory !== 'General' && newCategory !== product.category) {
        if (!dryRun) {
          await prisma.product.update({
            where: { id: product.id },
            data: { category: newCategory },
          })
        }
        changes.push({ title: product.title.substring(0, 40) + '...', from: product.category, to: newCategory })
        updated++
      } else {
        skipped++
      }

      // ✅ Increased delay to 1200ms (1.2s) between AI calls
      if (process.env.HUGGINGFACE_API_KEY) {
        await new Promise(r => setTimeout(r, 1200))
      }
    }

    const remaining = await prisma.product.count({
      where: { category: { in: ['General', 'general', 'Uncategorized', ''] } }
    })

    return NextResponse.json({
      message: dryRun ? `Preview: ${updated} products would be updated.` : `Successfully rescued ${updated} products!`,
      stats: {
        processedThisBatch: products.length,
        updated,
        remainedGeneral: skipped,
        remainingInDatabase: remaining
      },
      changes
    })

  } catch (error: any) {
    console.error('[REMAP_GENERAL_ERROR]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
      }
