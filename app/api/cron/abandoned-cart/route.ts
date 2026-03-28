// app/api/cron/abandoned-cart/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Find carts abandoned more than 1 hour ago, but less than 24 hours ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const pendingCarts = await prisma.abandonedCart.findMany({
    where: {
      emailSent: false,
      updatedAt: { lte: oneHourAgo, gte: twentyFourHoursAgo },
    },
    take: 20,
  })

  let sentCount = 0

  for (const cart of pendingCarts) {
    // 1. Check if the user completed an order recently with this email
    const completedOrder = await prisma.order.findFirst({
      where: {
        email: cart.email,
        createdAt: { gte: cart.createdAt },
      },
    })

    // If they bought something, delete the abandoned cart record and skip
    if (completedOrder) {
      await prisma.abandonedCart.delete({ where: { id: cart.id } })
      continue
    }

    // 2. Prepare Email Content
    const items = cart.cartData as any[]
    const itemsListHtml = items.map(item => `
      <div style="display:flex; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
        <img src="${item.image}" width="50" height="50" style="object-fit:cover; border-radius:5px; margin-right:15px;" />
        <div>
          <p style="margin:0; font-weight:bold;">${item.title}</p>
          <p style="margin:0; color:#666;">$${item.price.toFixed(2)} x ${item.quantity}</p>
        </div>
      </div>
    `).join('')

    // 3. Send Email via Resend
    try {
      await resend.emails.send({
        from: 'TealMart <orders@tealmart.com>',
        to: cart.email,
        subject: '🛒 You left something in your cart!',
        html: `
          <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:10px;">
            <h2 style="color:#14b8a6;">Items are waiting for you!</h2>
            <p>Hi there, we noticed you left some great items in your TealMart cart. They are still available, but they move fast!</p>
            <div style="margin:25px 0;">
              ${itemsListHtml}
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/cart" 
               style="display:inline-block; background:#14b8a6; color:white; padding:12px 25px; text-decoration:none; border-radius:8px; font-weight:bold;">
               Finish Checkout Now →
            </a>
            <p style="font-size:12px; color:#94a3b8; margin-top:30px;">
              You received this because you started a checkout on TealMart.
            </p>
          </div>
        `
      })

      // 4. Mark as sent
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { emailSent: true, sentAt: new Date() }
      })
      sentCount++
    } catch (e) {
      console.error(`Failed to send email to ${cart.email}`, e)
    }
  }

  return NextResponse.json({ success: true, emailsSent: sentCount })
}
