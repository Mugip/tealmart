// app/api/admin/products/bulk/route.ts

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
    const { ids, action } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No products selected' },
        { status: 400 }
      )
    }

    const validActions = ['activate', 'deactivate', 'delete']

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    let result

    if (action === 'activate') {
      result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true },
      })
    } else if (action === 'deactivate') {
      result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
      })
    } else if (action === 'delete') {
      result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      })
    }

    return NextResponse.json({
      success: true,
      count: result?.count ?? 0,
      message: `${result?.count ?? 0} products ${action}d successfully`,
    })
  } catch (error: any) {
    console.error('Bulk action error:', error)

    return NextResponse.json(
      { error: error.message || 'Bulk action failed' },
      { status: 500 }
    )
  }
}
