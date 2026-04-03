// app/api/webhooks/stripe/route.ts
/**
 * Stripe Webhook Handler
 * Handles payment completion, failures, and other events
 */

import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }

  // Handle checkout session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // Find and update payment transaction
      const transaction = await prisma.paymentTransaction.update({
        where: { transactionId: session.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          webhookVerified: true,
          metadata: session,
        },
      })

      // Update order payment status
      await prisma.order.update({
        where: { id: session.metadata?.orderId },
        data: { paymentStatus: 'completed' },
      })

      console.log(`✅ Payment completed for order: ${session.metadata?.orderId}`)
    } catch (error) {
      console.error('Error updating payment transaction:', error)
      return new Response('Error processing payment', { status: 500 })
    }
  }

  // Handle payment intent failed
  if (event.type === 'charge.failed') {
    const charge = event.data.object as Stripe.Charge

    try {
      await prisma.paymentTransaction.update({
        where: { transactionId: charge.payment_intent as string },
        data: {
          status: 'failed',
          errorMessage: charge.failure_message || 'Payment failed',
          errorCode: charge.failure_code,
          webhookVerified: true,
        },
      })
    } catch (error) {
      console.error('Error updating failed payment:', error)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

// ═══════════════════════════════════════════════════════════════════════════

// app/api/webhooks/flutterwave/route.ts
/**
 * Flutterwave Webhook Handler
 */

import crypto from 'crypto'

export async function POST(req: Request) {
  const body = await req.json()
  const hash = req.headers.get('verifi-hash')

  // Verify webhook signature
  const hashCheck = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY!)
    .update(JSON.stringify(body))
    .digest('hex')

  if (hash !== hashCheck) {
    return new Response('Invalid webhook signature', { status: 403 })
  }

  try {
    const { data, event } = body

    if (event === 'charge.completed') {
      const { flw_ref, tx_ref, amount, status } = data

      // Update payment transaction
      const transaction = await prisma.paymentTransaction.update({
        where: { transactionId: flw_ref },
        data: {
          status: status === 'successful' ? 'completed' : 'failed',
          completedAt: status === 'successful' ? new Date() : null,
          webhookVerified: true,
          metadata: data,
        },
      })

      // Update order if completed
      if (status === 'successful') {
        await prisma.order.update({
          where: { id: tx_ref },
          data: { paymentStatus: 'completed' },
        })
      }

      console.log(`✅ Flutterwave payment ${status}: ${flw_ref}`)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Flutterwave webhook error:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════

// app/api/webhooks/pesapal/route.ts
/**
 * Pesapal Webhook Handler
 */

export async function POST(req: Request) {
  try {
    const { OrderTrackingId, OrderMerchantReference, OrderStatus } = await req.json()

    const statusMap: Record<string, string> = {
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'INVALID': 'failed',
      'PENDING': 'pending',
    }

    const transaction = await prisma.paymentTransaction.update({
      where: { transactionId: OrderTrackingId },
      data: {
        status: statusMap[OrderStatus] || 'pending',
        completedAt: OrderStatus === 'COMPLETED' ? new Date() : null,
        webhookVerified: true,
      },
    })

    if (OrderStatus === 'COMPLETED') {
      await prisma.order.update({
        where: { id: OrderMerchantReference },
        data: { paymentStatus: 'completed' },
      })
    }

    console.log(`✅ Pesapal payment ${OrderStatus}: ${OrderTrackingId}`)

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Pesapal webhook error:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════

// app/api/webhooks/paypal/route.ts
/**
 * PayPal Webhook Handler
 */

import axios from 'axios'

async function verifyPayPalWebhook(req: Request, body: any) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID

  const verificationRequest = {
    transmission_id: req.headers.get('paypal-transmission-id'),
    transmission_time: req.headers.get('paypal-transmission-time'),
    cert_url: req.headers.get('paypal-cert-url'),
    auth_algo: req.headers.get('paypal-auth-algo'),
    transmission_sig: req.headers.get('paypal-transmission-sig'),
    webhook_id: webhookId,
    webhook_event: body,
  }

  try {
    const response = await axios.post(
      `${
        process.env.PAYPAL_ENV === 'sandbox'
          ? 'https://api-sandbox.paypal.com'
          : 'https://api.paypal.com'
      }/v1/notifications/verify-webhook-signature`,
      verificationRequest,
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID!,
          password: process.env.PAYPAL_CLIENT_SECRET!,
        },
      }
    )

    return response.data.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('PayPal verification error:', error)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Verify webhook authenticity
    const isValid = await verifyPayPalWebhook(req, body)
    if (!isValid) {
      return new Response('Invalid webhook', { status: 403 })
    }

    const { event_type, resource } = body

    if (event_type === 'CHECKOUT.ORDER.COMPLETED') {
      const transaction = await prisma.paymentTransaction.update({
        where: { transactionId: resource.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          webhookVerified: true,
          metadata: resource,
        },
      })

      await prisma.order.update({
        where: { id: resource.purchase_units[0].reference_id },
        data: { paymentStatus: 'completed' },
      })

      console.log(`✅ PayPal payment completed: ${resource.id}`)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}
