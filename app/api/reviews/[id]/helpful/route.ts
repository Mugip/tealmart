// app/api/reviews/[id]/helpful/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const review = await prisma.review.findUnique({ where: { id: params.id } })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (review.helpfulUsers?.includes(userId)) {
    return NextResponse.json({ error: 'Already voted' }, { status: 400 })
  }

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: {
      helpful: { increment: 1 },
      helpfulUsers: { push: userId },
    },
  })

  return NextResponse.json(updated)
}
