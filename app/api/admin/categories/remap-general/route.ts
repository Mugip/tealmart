// app/api/admin/categories/remap-general/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { classifyProduct } from '@/lib/productClassifier'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  // 1. Verify Admin Auth
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  if (!session || !session.permissions.includes('all')) {
    return NextResponse.json({ error: 'Unauthorized. Super Admin only.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = body.dryRun !== false

  try {
    // 2. Fetch up to 50 "General" products to prevent Vercel Server timeouts
    const products = await prisma.product.findMany({
      where: {
        category: { in: ['General', 'general', 'Uncategorized', ''] }
      },
      select: { id: true, title: true, description: true, category: true },
      take: 50 
    })

    if (products.length === 0) {
      return NextResponse.json({ message: "No 'General' products found! You're all caught up." })
    }

    let updated = 0
    let skipped = 0
    const changes: Array<{ title: string; from: string; to: string }> = []

    // 3. Process the batch
    for (const product of products) {
      const newCategory = await classifyProduct(product.title, product.description, product.category)

      if (newCategory !== 'General' && newCategory !== 'general' && newCategory !== product.category) {
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

      // Small delay to respect Hugging Face free tier limits
      if (process.env.HUGGINGFACE_API_KEY) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // 4. Check how many are left in total
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
