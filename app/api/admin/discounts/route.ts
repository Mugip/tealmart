// app/api/admin/discounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers' // ✅ Added for cookie access
import { verifyAdminToken } from '@/lib/adminAuth'

/**
 * Helper to verify admin status via cookies
 */
async function isAdminAuthenticated() {
  const token = cookies().get('admin-auth')?.value
  if (!token) return false
  return await verifyAdminToken(token)
}

// GET /api/admin/discounts — list all discount codes
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ codes })
  } catch (err) {
    console.error('[DISCOUNTS_GET_ERROR]', err)
    return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 })
  }
}

// POST /api/admin/discounts — create a new discount code
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { code, type, value, minPurchase, maxUses, validUntil } = body

    // Validation
    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return NextResponse.json({ error: 'Code must be at least 3 characters.' }, { status: 400 })
    }

    if (!['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'].includes(type)) {
      return NextResponse.json({ error: 'Type must be PERCENTAGE, FIXED, or FREE_SHIPPING.' }, { status: 400 })
    }

    if (type !== 'FREE_SHIPPING' && (typeof value !== 'number' || value <= 0)) {
      return NextResponse.json({ error: 'Value must be a positive number.' }, { status: 400 })
    }

    if (type === 'PERCENTAGE' && value > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%.' }, { status: 400 })
    }

    const newCode = await prisma.discountCode.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'FREE_SHIPPING' ? 0 : value,
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ code: newCode }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'That discount code already exists.' }, { status: 409 })
    }
    console.error('[DISCOUNTS_POST_ERROR]', err)
    return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 })
  }
}

// PATCH /api/admin/discounts — toggle active state
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const updated = await prisma.discountCode.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ code: updated })
  } catch (err) {
    console.error('[DISCOUNTS_PATCH_ERROR]', err)
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
  }
}

// DELETE /api/admin/discounts?id=xxx
export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.discountCode.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DISCOUNTS_DELETE_ERROR]', err)
    return NextResponse.json({ error: 'Failed to delete discount code' }, { status: 500 })
  }
}
