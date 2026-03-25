// app/api/wishlist/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true, title: true, price: true, compareAtPrice: true,
          images: true, rating: true, reviewCount: true, isActive: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(wishlist)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  try {
    const item = await prisma.wishlistItem.create({
      data: { userId: session.user.id, productId },
    })
    return NextResponse.json(item, { status: 201 })
  } catch {
    // Already exists - silently succeed
    return NextResponse.json({ ok: true })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  })

  return NextResponse.json({ ok: true })
}
