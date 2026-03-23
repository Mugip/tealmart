// lib/email/sendOrderUpdate.ts
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

interface OrderUpdateData {
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName: string
  status: string
  trackingNumber?: string
  total: number
  items: OrderItem[]
}

export async function sendOrderUpdate(data: OrderUpdateData) {
  try {
    const { orderId, orderNumber, customerEmail, customerName, status, trackingNumber, total, items } = data

    // Status-specific messages
    const statusMessages: Record<string, { title: string; message: string; color: string }> = {
      PENDING: {
        title: 'Order Received',
        message: 'We\'ve received your order and will begin processing it shortly.',
        color: '#EAB308',
      },
      PROCESSING: {
        title: 'Order Processing',
        message: 'Your order is being prepared for shipment.',
        color: '#3B82F6',
      },
      SHIPPED: {
        title: 'Order Shipped! 📦',
        message: 'Great news! Your order is on its way.',
        color: '#8B5CF6',
      },
      DELIVERED: {
        title: 'Order Delivered! 🎉',
        message: 'Your order has been delivered. We hope you love it!',
        color: '#10B981',
      },
      CANCELLED: {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled as requested.',
        color: '#EF4444',
      },
      REFUNDED: {
        title: 'Order Refunded',
        message: 'Your refund has been processed.',
        color: '#6B7280',
      },
    }

    const statusInfo = statusMessages[status] || statusMessages.PROCESSING

    const itemsHtml = items
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

    const trackingHtml = trackingNumber
      ? `
      <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1E40AF;">Tracking Information</p>
        <p style="margin: 0; font-size: 14px; color: #1F2937;">
          Tracking Number: <strong>${trackingNumber}</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280;">
          You can track your package using this number with your carrier.
        </p>
      </div>
    `
      : ''

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${statusInfo.color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${statusInfo.title}</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${customerName},</p>

            <p style="font-size: 16px;">
              ${statusInfo.message}
            </p>

            ${trackingHtml}

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #0D9488;">Order Details</h2>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${status}</span></p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #0D9488;">Order Summary</h2>
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
                      $${total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://tealmart.vercel.app'}/account/orders"
                 style="display: inline-block; background: #14B8A6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Details
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

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TealMart <orders@tealmart.com>',
      to: customerEmail,
      subject: `Order Update: ${statusInfo.title} - #${orderNumber}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Failed to send order update:', error)
    return { success: false, error }
  }
}
