// app/api/abandoned-cart/route.ts
// Called from CartContext when user provides an email (e.g. at checkout start)
// but doesn't complete purchase within 1 hour.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, cartData } = await req.json()

    if (!email || !cartData) {
      return NextResponse.json({ ok: true })
    }

    // Upsert — one record per email, keep refreshing with latest cart
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
          cartData,
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.abandonedCart.create({
        data: {
          id: `ac_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          email: email.toLowerCase(),
          cartData,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[abandoned-cart] Error:', err)
    return NextResponse.json({ ok: true }) // never break the client
  }
}
