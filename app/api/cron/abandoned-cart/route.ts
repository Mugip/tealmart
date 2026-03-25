// app/api/cron/abandoned-cart/route.ts
// Schedule in vercel.json: { "path": "/api/cron/abandoned-cart", "schedule": "0 * * * *" }

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find carts abandoned > 1 hour ago, email not yet sent
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const carts = await prisma.abandonedCart.findMany({
    where: {
      emailSent: false,
      updatedAt: { lte: oneHourAgo },
    },
    take: 50, // limit per run
  })

  let sent = 0
  let failed = 0

  for (const cart of carts) {
    try {
      const items = (cart.cartData as any[]) || []
      if (!items.length) continue

      const itemsHtml = items
        .map(
          (item) => `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6">
              <img src="${item.image || ''}" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:10px" />
              ${item.title}
            </td>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:right">
              $${(item.price * item.quantity).toFixed(2)}
            </td>
          </tr>
        `
        )
        .join('')

      const subtotal = items.reduce(
        (s: number, i: any) => s + i.price * i.quantity,
        0
      )

      await resend.emails.send({
        from: 'TealMart <orders@tealmart.com>',
        to: cart.email,
        subject: '🛒 You left something behind!',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
            
            <div style="background:linear-gradient(135deg,#14B8A6,#0D9488);padding:30px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:white;margin:0;font-size:24px">
                You left something behind!
              </h1>
            </div>

            <div style="background:#f9fafb;padding:30px;border-radius:0 0 12px 12px">
              <p style="font-size:16px;color:#374151">
                Hi there! You have items in your TealMart cart. Come back and complete your order before they sell out!
              </p>

              <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;margin:20px 0">
                ${itemsHtml}
              </table>

              <p style="font-size:18px;font-weight:bold;text-align:right;color:#111">
                Subtotal: $${subtotal.toFixed(2)}
              </p>

              <div style="text-align:center;margin:24px 0">
                <a href="${process.env.NEXTAUTH_URL || 'https://tealmart.vercel.app'}/cart"
                   style="background:linear-gradient(135deg,#14B8A6,#0D9488);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                  Complete My Order →
                </a>
              </div>

              <p style="font-size:12px;color:#9ca3af;text-align:center">
                This email was sent because you started a checkout on TealMart.<br/>
                <a href="${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(
                  cart.email
                )}" style="color:#9ca3af">
                  Unsubscribe
                </a>
              </p>
            </div>

          </body>
          </html>
        `,
      })

      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: {
          emailSent: true,
          sentAt: new Date(),
        },
      })

      sent++
    } catch (err) {
      console.error(
        `[abandoned-cart cron] Failed for ${cart.email}:`,
        err
      )
      failed++
    }
  }

  console.log(
    `[abandoned-cart cron] Sent: ${sent}, Failed: ${failed}`
  )

  return NextResponse.json({ ok: true, sent, failed })
}
