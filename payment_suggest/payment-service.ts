// lib/payment/service.ts
/**
 * Payment Service
 * Handles all payment processing across multiple providers
 */

import Stripe from 'stripe'
import axios from 'axios'
import crypto from 'crypto'
import { PAYMENT_CONFIG, Currency, PaymentProvider, Region } from './config'

// Initialize Stripe
const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
  apiVersion: '2023-10-16',
})

// Exchange rate service (use a real service like exchangerate-api in production)
const EXCHANGE_RATES: Record<Currency, Record<Currency, number>> = {
  USD: { USD: 1, UGX: 3700, EUR: 0.92, GBP: 0.79, KES: 155, TZS: 2600, NGN: 1650 },
  UGX: { USD: 0.00027, UGX: 1, EUR: 0.00025, GBP: 0.00021, KES: 0.042, TZS: 0.7, NGN: 0.45 },
  EUR: { USD: 1.09, UGX: 4029, EUR: 1, GBP: 0.86, KES: 169, TZS: 2826, NGN: 1796 },
  GBP: { USD: 1.27, UGX: 4684, EUR: 1.16, GBP: 1, KES: 196, TZS: 3288, NGN: 2088 },
  KES: { USD: 0.0065, UGX: 24, EUR: 0.0059, GBP: 0.0051, KES: 1, TZS: 16.8, NGN: 10.6 },
  TZS: { USD: 0.00038, UGX: 1.43, EUR: 0.00035, GBP: 0.0003, KES: 0.06, TZS: 1, NGN: 0.63 },
  NGN: { USD: 0.00061, UGX: 2.24, EUR: 0.00056, GBP: 0.00048, KES: 0.094, TZS: 1.59, NGN: 1 },
}

interface PaymentResult {
  success: boolean
  transactionId: string
  status: 'pending' | 'completed' | 'failed'
  message: string
  provider: PaymentProvider
  amount: number
  currency: Currency
  timestamp: Date
}

interface InitiatePaymentParams {
  orderId: string
  amount: number
  currency: Currency
  provider: PaymentProvider
  customerEmail: string
  customerName: string
  items: Array<{ name: string; amount: number; quantity: number }>
  region: Region
  returnUrl?: string
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) return amount
  
  // For production, fetch real-time rates from exchangerate-api.com
  // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
  // const data = await response.json()
  // return amount * data.rates[toCurrency]
  
  const rate = EXCHANGE_RATES[fromCurrency]?.[toCurrency] || 1
  return parseFloat((amount * rate).toFixed(2))
}

/**
 * Initiate payment via Stripe (Global - Cards, Apple Pay, Google Pay)
 */
export async function initiateStripePayment(
  params: InitiatePaymentParams
): Promise<PaymentResult> {
  try {
    // Convert to USD if needed (Stripe uses smallest currency unit)
    const amountInUSD = params.currency === 'USD' 
      ? params.amount 
      : await convertCurrency(params.amount, params.currency, 'USD')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      line_items: params.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round((item.amount * 100) / item.quantity),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
      customer_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
        currency: params.currency,
      },
    })

    return {
      success: true,
      transactionId: session.id,
      status: 'pending',
      message: 'Stripe checkout session created',
      provider: 'stripe',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Stripe payment error:', error)
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Stripe payment failed',
      provider: 'stripe',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  }
}

/**
 * Initiate payment via Flutterwave (Africa - Mobile Money, Cards)
 */
export async function initiateFlutterwavePayment(
  params: InitiatePaymentParams
): Promise<PaymentResult> {
  try {
    // Map currency to Flutterwave supported currency
    const fwCurrency = params.currency === 'UGX' ? 'UGX' : params.currency === 'KES' ? 'KES' : 'USD'
    
    const payload = {
      public_key: PAYMENT_CONFIG.flutterwave.publicKey,
      tx_ref: params.orderId,
      amount: params.amount,
      currency: fwCurrency,
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      customizations: {
        title: 'TealMart',
        description: 'Purchase from TealMart Store',
        logo: 'https://tealmart.com/logo.png', // Update with your logo
      },
      redirect_url: `${process.env.NEXT_PUBLIC_URL}/checkout/flutterwave-callback`,
    }

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYMENT_CONFIG.flutterwave.secretKey}`,
        },
      }
    )

    return {
      success: true,
      transactionId: response.data.data.id,
      status: 'pending',
      message: 'Flutterwave payment initiated',
      provider: 'flutterwave',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Flutterwave payment error:', error)
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Flutterwave payment failed',
      provider: 'flutterwave',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  }
}

/**
 * Initiate payment via Pesapal (East Africa - Bank transfers, Mobile money)
 */
export async function initiatePesapalPayment(
  params: InitiatePaymentParams
): Promise<PaymentResult> {
  try {
    const payload = {
      id: params.orderId,
      currency: params.currency,
      amount: params.amount,
      description: 'TealMart Purchase',
      callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/pesapal`,
      notification_id: crypto.randomBytes(16).toString('hex'),
      billing_address: {
        email_address: params.customerEmail,
        first_name: params.customerName.split(' ')[0],
        last_name: params.customerName.split(' ')[1] || '',
      },
    }

    // Pesapal requires OAuth2 authentication
    const tokenResponse = await axios.post(
      `${PAYMENT_CONFIG.pesapal.apiUrl}/v3/api/auth/token`,
      {
        client_id: PAYMENT_CONFIG.pesapal.consumerKey,
        client_secret: PAYMENT_CONFIG.pesapal.consumerSecret,
      }
    )

    const token = tokenResponse.data.token

    // Create order
    const orderResponse = await axios.post(
      `${PAYMENT_CONFIG.pesapal.apiUrl}/v3/api/transactions/initiate`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return {
      success: true,
      transactionId: orderResponse.data.order_tracking_id,
      status: 'pending',
      message: 'Pesapal payment initiated',
      provider: 'pesapal',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Pesapal payment error:', error)
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Pesapal payment failed',
      provider: 'pesapal',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  }
}

/**
 * Initiate payment via PayPal (Global)
 */
export async function initiatePayPalPayment(
  params: InitiatePaymentParams
): Promise<PaymentResult> {
  try {
    // Convert to USD for PayPal
    const amountInUSD = params.currency === 'USD' 
      ? params.amount 
      : await convertCurrency(params.amount, params.currency, 'USD')

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.orderId,
          amount: {
            currency_code: 'USD',
            value: amountInUSD.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: amountInUSD.toFixed(2),
              },
            },
          },
          items: params.items.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: 'USD',
              value: (item.amount / item.quantity).toFixed(2),
            },
            quantity: item.quantity.toString(),
          })),
        },
      ],
      application_context: {
        brand_name: 'TealMart',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
      },
    }

    const response = await axios.post(
      `${PAYMENT_CONFIG.paypal.environment === 'sandbox' 
        ? 'https://api-sandbox.paypal.com' 
        : 'https://api.paypal.com'}/v2/checkout/orders`,
      payload,
      {
        auth: {
          username: PAYMENT_CONFIG.paypal.clientId,
          password: PAYMENT_CONFIG.paypal.clientSecret,
        },
      }
    )

    return {
      success: true,
      transactionId: response.data.id,
      status: 'pending',
      message: 'PayPal order created',
      provider: 'paypal',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('PayPal payment error:', error)
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      message: error instanceof Error ? error.message : 'PayPal payment failed',
      provider: 'paypal',
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  }
}

/**
 * Main function to initiate payment (routes to appropriate provider)
 */
export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<PaymentResult> {
  try {
    switch (params.provider) {
      case 'stripe':
        return await initiateStripePayment(params)
      case 'flutterwave':
        return await initiateFlutterwavePayment(params)
      case 'pesapal':
        return await initiatePesapalPayment(params)
      case 'paypal':
        return await initiatePayPalPayment(params)
      default:
        return {
          success: false,
          transactionId: '',
          status: 'failed',
          message: 'Unknown payment provider',
          provider: 'stripe',
          amount: params.amount,
          currency: params.currency,
          timestamp: new Date(),
        }
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Payment failed',
      provider: params.provider,
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
    }
  }
}

/**
 * Verify payment status
 */
export async function verifyPaymentStatus(
  transactionId: string,
  provider: PaymentProvider
): Promise<{ status: 'pending' | 'completed' | 'failed'; verified: boolean }> {
  try {
    switch (provider) {
      case 'stripe': {
        const session = await stripe.checkout.sessions.retrieve(transactionId)
        return {
          status: session.payment_status === 'paid' ? 'completed' : 'pending',
          verified: true,
        }
      }
      case 'flutterwave': {
        const response = await axios.get(
          `https://api.flutterwave.com/v3/transactions/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${PAYMENT_CONFIG.flutterwave.secretKey}`,
            },
          }
        )
        return {
          status: response.data.data.status === 'successful' ? 'completed' : 'failed',
          verified: true,
        }
      }
      default:
        return { status: 'pending', verified: false }
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return { status: 'failed', verified: false }
  }
}
