// app/api/admin/discounts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/adminAuth'

// ============================================
// AUTH HELPER (same logic as /admin/me)
// ============================================

async function requireAdmin(req?: NextRequest) {
  const cookieStore = cookies()

  const token =
    cookieStore.get('admin-auth')?.value ||
    req?.headers.get('x-admin-token') ||
    null

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

// ============================================
// GET — list discount codes
// ============================================

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ codes })
  } catch (err) {
    console.error('[DISCOUNTS_GET_ERROR]', err)
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    )
  }
}

// ============================================
// POST — create discount
// ============================================

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { code, type, value, minPurchase, maxUses, validUntil } = body

    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return NextResponse.json(
        { error: 'Code must be at least 3 characters.' },
        { status: 400 }
      )
    }

    if (!['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid discount type.' },
        { status: 400 }
      )
    }

    if (type !== 'FREE_SHIPPING' && (typeof value !== 'number' || value <= 0)) {
      return NextResponse.json(
        { error: 'Value must be a positive number.' },
        { status: 400 }
      )
    }

    if (type === 'PERCENTAGE' && value > 100) {
      return NextResponse.json(
        { error: 'Percentage cannot exceed 100%.' },
        { status: 400 }
      )
    }

    const newCode = await prisma.discountCode.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'FREE_SHIPPING' ? 0 : value,
        minPurchase: minPurchase ?? null,
        maxUses: maxUses ?? null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ code: newCode }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Discount code already exists.' },
        { status: 409 }
      )
    }

    console.error('[DISCOUNTS_POST_ERROR]', err)
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH — toggle active
// ============================================

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const { id, isActive } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const updated = await prisma.discountCode.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ code: updated })
  } catch (err) {
    console.error('[DISCOUNTS_PATCH_ERROR]', err)
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE
// ============================================

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req)
  if (authError) return authError

  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.discountCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DISCOUNTS_DELETE_ERROR]', err)
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    )
  }
                                     }
