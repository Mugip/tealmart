// app/api/admin/categories/remap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { classifyProductSync, classifyProduct } from '@/lib/productClassifier'

const INGESTION_API_KEY = process.env.INGESTION_API_KEY!

// ============================================
// HANDLER (shared logic)
// ============================================
async function handleRequest(req: NextRequest) {
  // 🔐 Auth (browser + header support)
  const url = new URL(req.url)
  const queryKey = url.searchParams.get('key')
  const headerKey = req.headers.get('x-api-key')
  const key = queryKey || headerKey

  if (!INGESTION_API_KEY || key !== INGESTION_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Body parsing
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
          await prisma.product.update({ where: { id: product.id }, data: { category: newCategory } })
        }

        const changeKey = `${product.category} → ${newCategory}`
        changeSummary[changeKey] = (changeSummary[changeKey] || 0) + 1

        if (changes.length < 100) {
          changes.push({ id: product.id, title: product.title.substring(0, 80), from: product.category, to: newCategory })
        }

        updated++
      } else {
        unchanged++
      }
    } catch {
      errors++
    }
  }

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
    message: dryRun ? `Preview: ${updated} products would be updated` : `Updated ${updated} products`,
    dryRun,
    useAI,
    stats: { total: products.length, updated, unchanged, errors, duration },
    changeSummary,
    changes,
    categoryDistribution,
  })
}

// ============================================
// TEMPORARY DEBUG ENDPOINT
// ============================================
export async function DEBUG(req: NextRequest) {
  const url = new URL(req.url)
  const queryKey = url.searchParams.get('key')
  const headerKey = req.headers.get('x-api-key')
  const cookies = Object.fromEntries(req.cookies)
  return NextResponse.json({
    message: 'DEBUG INFO',
    queryKey,
    headerKey,
    cookies,
    ingestionEnvKeySet: !!INGESTION_API_KEY,
  })
}

// ============================================
// ROUTES
// ============================================
export async function GET(req: NextRequest) {
  // Access /debug?key= or normal remap
  if (req.url.includes('/debug')) return DEBUG(req)
  return handleRequest(req)
}

export async function POST(req: NextRequest) {
  return handleRequest(req)
    }
