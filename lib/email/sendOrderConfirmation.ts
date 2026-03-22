// lib/email/sendOrderConfirmation.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderItem {
  product: {
    title: string
    price: number
  }
  quantity: number
  price: number
}

interface Order {
  id: string
  customerEmail: string
  customerName: string
  total: number
  items: OrderItem[]
  createdAt: Date
}

export async function sendOrderConfirmation(order: Order) {
  try {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${item.product.title}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${item.price.toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #14B8A6, #0D9488); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${order.customerName},</p>

            <p style="font-size: 16px;">
              Thank you for your order! We've received your order and will process it shortly.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #0D9488;">Order Details</h2>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #0D9488;">Items Ordered</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left;">Product</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="font-weight: bold; font-size: 18px;">
                    <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
                    <td style="padding: 12px; text-align: right; color: #0D9488;">
                      $${order.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 20px 0;">
              <p style="margin: 0;"><strong>What's Next?</strong></p>
              <p style="margin: 10px 0 0 0;">
                We'll send you another email once your order ships with tracking information.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://tealmart.vercel.app'}/account/orders"
                 style="display: inline-block; background: #14B8A6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Status
              </a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
              Questions? Contact us at
              <a href="mailto:support@tealmart.com" style="color: #14B8A6;">support@tealmart.com</a>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TealMart. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TealMart <orders@tealmart.com>',
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.id}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
    return { success: false, error }
  }
}
