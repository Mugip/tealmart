// app/api/abandoned-cart/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, cartData } = await req.json()

    if (!email || !cartData || cartData.length === 0) {
      return NextResponse.json({ ok: true })
    }

    // Upsert: If this email already has an abandoned cart that hasn't been sent yet, update it.
    // This prevents spamming multiple emails if they refresh the checkout.
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        email: email.toLowerCase(),
        emailSent: false,
      },
    })

    if (existing) {
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          cartData: cartData,
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.abandonedCart.create({
        data: {
          email: email.toLowerCase(),
          cartData: cartData,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ABANDONED_CART_SAVE_ERROR]', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
