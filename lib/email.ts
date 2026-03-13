// lib/email.ts
import { Resend } from 'resend'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmation'
import { ShippingConfirmationEmail } from '@/emails/ShippingConfirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmationEmail(data: {
  to: string
  orderNumber: string
  customerName: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    price: number
    image: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'TealMart <orders@tealmart.com>',
      to: data.to,
      subject: `Order Confirmation - #${data.orderNumber}`,
      react: OrderConfirmationEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        orderDate: data.orderDate,
        items: data.items,
        subtotal: data.subtotal,
        shipping: data.shipping,
        tax: data.tax,
        total: data.total,
        shippingAddress: data.shippingAddress,
      }),
    })

    if (error) {
      console.error('Failed to send order confirmation email:', error)
      return { success: false, error }
    }

    console.log('Order confirmation email sent:', emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

export async function sendShippingConfirmationEmail(data: {
  to: string
  orderNumber: string
  customerName: string
  trackingNumber: string
  carrier: string
  estimatedDelivery: string
  items: Array<{
    name: string
    quantity: number
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'TealMart <shipping@tealmart.com>',
      to: data.to,
      subject: `Your Order #${data.orderNumber} Has Shipped!`,
      react: ShippingConfirmationEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
        items: data.items,
        shippingAddress: data.shippingAddress,
      }),
    })

    if (error) {
      console.error('Failed to send shipping confirmation email:', error)
      return { success: false, error }
    }

    console.log('Shipping confirmation email sent:', emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(data: {
  to: string
  name: string
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'TealMart <hello@tealmart.com>',
      to: data.to,
      subject: 'Welcome to TealMart! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px;">Welcome to TealMart!</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p style="font-size: 18px; color: #1a1a1a;">Hi ${data.name},</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Thank you for joining TealMart! We're excited to have you as part of our community.
            </p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Explore our curated collection of quality products and enjoy:
            </p>
            <ul style="font-size: 16px; color: #666; line-height: 1.8;">
              <li>Free shipping on orders over $50</li>
              <li>30-day hassle-free returns</li>
              <li>Exclusive member discounts</li>
              <li>Fast, reliable delivery</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" style="background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Start Shopping
              </a>
            </div>
            <p style="font-size: 14px; color: #999; text-align: center; margin-top: 32px;">
              Need help? Contact us at <a href="mailto:support@tealmart.com" style="color: #0d9488;">support@tealmart.com</a>
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false, error }
    }

    console.log('Welcome email sent:', emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}
