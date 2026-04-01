// lib/email.ts

import { Resend } from 'resend'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmation'
import { ShippingConfirmationEmail } from '@/emails/ShippingConfirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ Single env (required)
const BASE_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'TealMart <onboarding@resend.dev>'

// ✅ Extract email address only (noreply@tealmart.com)
function extractEmail(from: string) {
  const match = from.match(/<(.+)>/)
  return match ? match[1] : from
}

// ✅ Dynamic sender generator
function getFrom(name: string) {
  const email = extractEmail(BASE_FROM_EMAIL)
  return `${name} <${email}>`
}

// ============================================
// ORDER CONFIRMATION
// ============================================

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
      from: getFrom('TealMart Orders'),
      to: data.to,
      subject: `Order Confirmation - #${data.orderNumber}`,
      react: OrderConfirmationEmail({
        ...data,
      }),
    })

    if (error) {
      console.error('[EMAIL_ORDER_ERROR]', error)
      return { success: false, error }
    }

    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error('[EMAIL_ORDER_EXCEPTION]', error)
    return { success: false, error }
  }
}

// ============================================
// SHIPPING CONFIRMATION
// ============================================

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
      from: getFrom('TealMart Shipping'),
      to: data.to,
      subject: `Your Order #${data.orderNumber} Has Shipped!`,
      react: ShippingConfirmationEmail({
        ...data,
      }),
    })

    if (error) {
      console.error('[EMAIL_SHIPPING_ERROR]', error)
      return { success: false, error }
    }

    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error('[EMAIL_SHIPPING_EXCEPTION]', error)
    return { success: false, error }
  }
}

// ============================================
// WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(data: {
  to: string
  name: string
}) {
  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const supportEmail =
      process.env.SUPPORT_EMAIL || extractEmail(BASE_FROM_EMAIL)

    const { data: emailData, error } = await resend.emails.send({
      from: getFrom('TealMart'),
      to: data.to,
      subject: 'Welcome to TealMart! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px;">Welcome to TealMart!</h1>
          </div>

          <div style="padding: 40px; background: #f9fafb;">
            <p style="font-size: 18px; color: #1a1a1a;">Hi ${data.name},</p>

            <p style="font-size: 16px; color: #666;">
              Thank you for joining TealMart! We're excited to have you.
            </p>

            <ul style="font-size: 16px; color: #666;">
              <li>Free shipping on orders over $50</li>
              <li>30-day returns</li>
              <li>Exclusive discounts</li>
            </ul>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${appUrl}/products"
                style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;">
                Start Shopping
              </a>
            </div>

            <p style="text-align:center;font-size:14px;color:#999;">
              Need help? Contact
              <a href="mailto:${supportEmail}">${supportEmail}</a>
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('[EMAIL_WELCOME_ERROR]', error)
      return { success: false, error }
    }

    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error('[EMAIL_WELCOME_EXCEPTION]', error)
    return { success: false, error }
  }
}
