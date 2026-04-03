// lib/payment/config.ts
/**
 * Payment Configuration
 * Supports: Stripe, PayPal, MTN Mobile Money (Uganda), Airtel Money (Uganda)
 * Currencies: USD, UGX, EUR, GBP, KES, etc.
 */

export const PAYMENT_CONFIG = {
  // Stripe Configuration (Global - Credit Cards, Digital Wallets)
  stripe: {
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // PayPal Configuration (Global - PayPal Balance, PayPal Credit)
  paypal: {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    environment: (process.env.PAYPAL_ENV || 'sandbox') as 'sandbox' | 'production',
    currency: 'USD', // PayPal primary currency
  },

  // Flutterwave Configuration (Africa - Multiple payment methods)
  flutterwave: {
    publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
  },

  // Pesapal Configuration (East Africa - Local integration)
  pesapal: {
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
    apiUrl: process.env.PESAPAL_API_URL || 'https://api.pesapal.com',
    iframeUrl: process.env.PESAPAL_IFRAME_URL || 'https://pesapal.com/api/PostPesapalDirectOrderV4',
  },

  // Supported Currencies with conversion rates
  currencies: {
    USD: { name: 'US Dollar', symbol: '$', minAmount: 0.5, maxAmount: 999999 },
    UGX: { name: 'Ugandan Shilling', symbol: 'USh', minAmount: 1000, maxAmount: 999999999 },
    EUR: { name: 'Euro', symbol: '€', minAmount: 0.5, maxAmount: 999999 },
    GBP: { name: 'British Pound', symbol: '£', minAmount: 0.5, maxAmount: 999999 },
    KES: { name: 'Kenyan Shilling', symbol: 'KSh', minAmount: 50, maxAmount: 9999999 },
    TZS: { name: 'Tanzanian Shilling', symbol: 'TSh', minAmount: 1000, maxAmount: 9999999999 },
    NGN: { name: 'Nigerian Naira', symbol: '₦', minAmount: 100, maxAmount: 999999999 },
  },

  // Payment Methods by Region
  paymentMethods: {
    global: [
      { id: 'stripe_card', name: 'Credit/Debit Card', provider: 'stripe', icon: '💳' },
      { id: 'paypal', name: 'PayPal', provider: 'paypal', icon: '🅿️' },
      { id: 'stripe_apple_pay', name: 'Apple Pay', provider: 'stripe', icon: '🍎' },
      { id: 'stripe_google_pay', name: 'Google Pay', provider: 'stripe', icon: '🔵' },
    ],
    uganda: [
      { id: 'mtn_money', name: 'MTN Mobile Money', provider: 'flutterwave', icon: '📱' },
      { id: 'airtel_money', name: 'Airtel Money', provider: 'flutterwave', icon: '📱' },
      { id: 'pesapal_bank', name: 'Bank Transfer', provider: 'pesapal', icon: '🏦' },
      { id: 'stripe_card', name: 'Credit/Debit Card', provider: 'stripe', icon: '💳' },
    ],
    east_africa: [
      { id: 'mtn_money', name: 'MTN Mobile Money', provider: 'flutterwave', icon: '📱' },
      { id: 'airtel_money', name: 'Airtel Money', provider: 'flutterwave', icon: '📱' },
      { id: 'equity_bank', name: 'Equity Bank', provider: 'flutterwave', icon: '🏦' },
      { id: 'stripe_card', name: 'Credit/Debit Card', provider: 'stripe', icon: '💳' },
    ],
  },

  // Fee structure (in percentage)
  fees: {
    stripe: 2.9 + 0.3, // 2.9% + $0.30
    paypal: 3.49 + 0.49, // 3.49% + $0.49
    flutterwave: 1.4, // 1.4% for local methods
    pesapal: 2.0, // 2% for bank transfers
  },

  // Webhook endpoints
  webhooks: {
    stripe: '/api/webhooks/stripe',
    paypal: '/api/webhooks/paypal',
    flutterwave: '/api/webhooks/flutterwave',
    pesapal: '/api/webhooks/pesapal',
  },
}

// Export payment provider types
export type PaymentProvider = 'stripe' | 'paypal' | 'flutterwave' | 'pesapal'
export type Currency = keyof typeof PAYMENT_CONFIG.currencies
export type Region = 'global' | 'uganda' | 'east_africa'

// Helper to get payment methods by region
export function getPaymentMethodsByRegion(region: Region) {
  return PAYMENT_CONFIG.paymentMethods[region] || PAYMENT_CONFIG.paymentMethods.global
}

// Helper to validate amount for currency
export function validateAmount(amount: number, currency: Currency): boolean {
  const currencyConfig = PAYMENT_CONFIG.currencies[currency]
  return amount >= currencyConfig.minAmount && amount <= currencyConfig.maxAmount
}
