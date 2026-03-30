// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const normalised = email.toLowerCase().trim()

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: normalised },
    })

    if (existing) {
      if (existing.status === 'ACTIVE') {
        // Don't expose whether the email is in the system — just say "done"
        return NextResponse.json({ success: true })
      }
      // Re-activate an unsubscribed user
      await prisma.subscriber.update({
        where: { email: normalised },
        data: { status: 'ACTIVE' },
      })
      return NextResponse.json({ success: true })
    }

    await prisma.subscriber.create({
      data: {
        email: normalised,
        source: 'homepage',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[NEWSLETTER_SUBSCRIBE_ERROR]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
