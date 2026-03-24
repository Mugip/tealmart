// app/api/admin/categories/remap/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  const token = cookies().get('admin-auth')?.value

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { fromCategory, toCategory } = await request.json()

    if (!fromCategory || !toCategory) {
      return NextResponse.json(
        { error: 'fromCategory and toCategory are required' },
        { status: 400 }
      )
    }

    const result = await prisma.product.updateMany({
      where: { category: fromCategory },
      data: { category: toCategory },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} products remapped from "${fromCategory}" to "${toCategory}"`,
    })
  } catch (error: any) {
    console.error('Remap categories error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to remap categories' },
      { status: 500 }
    )
  }
}
