// app/api/addresses/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const addresses = await prisma.savedAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  })
  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })              
  const body = await req.json()
  const { name, address, city, state, zip, country, phone, isDefault, saveForLater } = body

  if (!name || !address || !city || !zip || !country) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // If this is the default, un-default all others
  if (isDefault) {                                        await prisma.savedAddress.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    })
  }

  const saved = await prisma.savedAddress.create({
    data: {
      userId: session.user.id,
      name, address, city, state: state || '', zip, country,
      phone: phone || null,
      isDefault: !!isDefault,
    },
  })

  return NextResponse.json(saved, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.savedAddress.deleteMany({
    where: { id, userId: session.user.id },
  })                                                    return NextResponse.json({ ok: true })
}
