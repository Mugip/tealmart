// app/api/admin/categories/remap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { classifyProductSync, classifyProduct } from '@/lib/productClassifier'

const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

// ============================================
// HANDLER (shared logic)
// ============================================
async function handleRequest(req: NextRequest) {
  // 🔐 Auth
  const url = new URL(req.url)
  const queryKey = url.searchParams.get('key')
  const headerKey = req.headers.get('x-api-key')
  const cookieKey = req.cookies.get('admin-auth')?.value

  // Browser access (admin page) bypasses API key check
  const isAdminBrowser = !!cookieKey
  const keyMatches = headerKey === INGESTION_API_KEY || queryKey === INGESTION_API_KEY

  if (!isAdminBrowser && (!INGESTION_API_KEY || !keyMatches)) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        debug: {
          headerKey,
          queryKey,
          cookieKey,
          ingestionKeyDefined: !!INGESTION_API_KEY,
          ingestionKeyMatches: keyMatches,
        },
      },
      { status: 401 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = body.dryRun !== false // default true
  const useAI = body.useAI === true

  const startTime = Date.now()

  const products = await prisma.product.findMany({
    select: { id: true, title: true, description: true, category: true },
  })

  let updated = 0
  let unchanged = 0
  let errors = 0

  const changes: Array<{ id: string; title: string; from: string; to: string }> = []
  const changeSummary: Record<string, number> = {}

  for (const product of products) {
    try {
      const newCategory = useAI
        ? await classifyProduct(product.title, product.description, product.category)
        : classifyProductSync(product.title, product.description, product.category)

      if (newCategory !== product.category) {
        if (!dryRun) {
          await prisma.product.update({
            where: { id: product.id },
            data: { category: newCategory },
          })
        }

        const changeKey = `${product.category} → ${newCategory}`
        changeSummary[changeKey] = (changeSummary[changeKey] || 0) + 1

        if (changes.length < 100) {
          changes.push({
            id: product.id,
            title: product.title.substring(0, 80),
            from: product.category,
            to: newCategory,
          })
        }

        updated++
      } else {
        unchanged++
      }
    } catch {
      errors++
    }
  }

  // Category distribution
  const categoryStats = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  const categoryDistribution = categoryStats.map(stat => ({
    category: stat.category,
    count: stat._count.id,
    percentage: ((stat._count.id / products.length) * 100).toFixed(1),
  }))

  const duration = `${((Date.now() - startTime) / 1000).toFixed(2)}s`

  return NextResponse.json({
    message: dryRun
      ? `Preview: ${updated} products would be updated`
      : `Updated ${updated} products`,
    dryRun,
    useAI,
    stats: { total: products.length, updated, unchanged, errors, duration },
    changeSummary,
    changes,
    categoryDistribution,
    debug: isAdminBrowser
      ? { adminAccess: true, cookieKey }
      : { adminAccess: false, keyMatches },
  })
}

// ============================================
// ROUTES
// ============================================

// ✅ Browser-friendly
export async function GET(req: NextRequest) {
  return handleRequest(req)
}

// ✅ For scripts / API calls
export async function POST(req: NextRequest) {
  return handleRequest(req)
}
