# 🔐 Complete Payment System Setup Guide

## Overview
TealMart supports multiple payment providers for both **local (Uganda)** and **global** customers. This guide covers complete setup from API key acquisition to deployment.

---

## 📋 Table of Contents
1. [Environment Variables](#environment-variables)
2. [Payment Providers Setup](#payment-providers-setup)
3. [Database Migration](#database-migration)
4. [Integration Steps](#integration-steps)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔑 Environment Variables

Create a `.env.local` file in your project root and add all these variables:

```bash
# ═══════════════════════════════════════════════════════════════════════════
# STRIPE (Global - Credit Cards, Apple Pay, Google Pay)
# ═══════════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# ═══════════════════════════════════════════════════════════════════════════
# PAYPAL (Global - PayPal Balance, PayPal Credit)
# ═══════════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxx
PAYPAL_ENV=sandbox  # Change to 'production' for live
PAYPAL_WEBHOOK_ID=xxxxxxxxxxxxx

# ═══════════════════════════════════════════════════════════════════════════
# FLUTTERWAVE (Africa - MTN, Airtel, Equitel, Cards)
# ═══════════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxxxxxxxxxx

# ═══════════════════════════════════════════════════════════════════════════
# PESAPAL (East Africa - Bank transfers, Mobile money)
# ═══════════════════════════════════════════════════════════════════════════
PESAPAL_CONSUMER_KEY=xxxxxxxxxxxxx
PESAPAL_CONSUMER_SECRET=xxxxxxxxxxxxx
PESAPAL_API_URL=https://api-sandbox.pesapal.com  # Change for production
PESAPAL_IFRAME_URL=https://sandbox.pesapal.com/api/PostPesapalDirectOrderV4

# ═══════════════════════════════════════════════════════════════════════════
# APPLICATION SETTINGS
# ═══════════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_URL=http://localhost:3000  # Change to your domain in production
DATABASE_URL=postgresql://...  # Your Prisma database URL
```

---

## 💳 Payment Providers Setup

### 1. STRIPE (Global Payments)

#### Step-by-Step Setup:

1. **Create Account**: Go to [stripe.com](https://stripe.com)
2. **Go to Dashboard**: https://dashboard.stripe.com
3. **Get Keys**:
   - Click "Developers" → "API Keys"
   - Copy "Publishable Key" → `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
   - Copy "Secret Key" → `STRIPE_SECRET_KEY`

4. **Setup Webhook**:
   - Go to "Developers" → "Webhooks"
   - Click "Add Endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `charge.failed`
     - `charge.refunded`
   - Copy "Signing Secret" → `STRIPE_WEBHOOK_SECRET`

5. **Enable Payment Methods**:
   - Go to "Settings" → "Payment Methods"
   - Enable: Card, Apple Pay, Google Pay, ACH Direct Debit

**Testing Credit Cards** (Sandbox):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

### 2. PAYPAL (Global Payments)

#### Step-by-Step Setup:

1. **Create Account**: Go to [sandbox.paypal.com](https://sandbox.paypal.com)
2. **Developer Dashboard**: [developer.paypal.com](https://developer.paypal.com)
3. **Create App**:
   - Go to "Apps & Credentials"
   - Select "Sandbox" environment
   - Create an "Merchant" app
   - Copy credentials → `.env.local`

4. **Setup Webhook** (Optional but recommended):
   - Go to "Webhooks"
   - Add endpoint URL: `https://yourdomain.com/api/webhooks/paypal`
   - Subscribe to events:
     - `CHECKOUT.ORDER.COMPLETED`
     - `CHECKOUT.ORDER.APPROVED`

**Testing Accounts** (Sandbox):
- Buyer email: `sb-xxxxx@paypal.com`
- Use any password: `testpass123`

---

### 3. FLUTTERWAVE (Africa - Uganda, Kenya, etc.)

#### Step-by-Step Setup:

1. **Create Account**: Go to [flutterwave.com](https://flutterwave.com)
2. **Sign Up**: Choose "Merchant" account
3. **Dashboard**: https://dashboard.flutterwave.io
4. **Get Keys**:
   - Settings → API Keys
   - Copy "Public Key" → `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`
   - Copy "Secret Key" → `FLUTTERWAVE_SECRET_KEY`
   - Copy "Encryption Key" → `FLUTTERWAVE_ENCRYPTION_KEY`

5. **Enable Payment Methods**:
   - Settings → Integrations
   - Enable: MTN, Airtel, Cards, USSD, Bank Transfer

6. **Setup Webhook**:
   - Settings → Webhooks
   - Add: `https://yourdomain.com/api/webhooks/flutterwave`
   - Events: `charge.completed`

**Test Mobile Money** (Sandbox):
- MTN Number: `256757123456`
- PIN: `1234`

---

### 4. PESAPAL (East Africa - Uganda, Kenya, Tanzania)

#### Step-by-Step Setup:

1. **Create Account**: Go to [pesapal.com](https://pesapal.com)
2. **Merchant Dashboard**: https://merchant.pesapal.com
3. **Get Credentials**:
   - Settings → API Keys
   - Copy Consumer Key → `PESAPAL_CONSUMER_KEY`
   - Copy Consumer Secret → `PESAPAL_CONSUMER_SECRET`

4. **Integration Key**:
   - Settings → Integration
   - Generate new key for API authentication

5. **Setup IPN** (Instant Payment Notification):
   - Settings → IPN Settings
   - Add IPN URL: `https://yourdomain.com/api/webhooks/pesapal`

**Test Bank Details** (Sandbox):
- Bank: Demo Bank
- Account: 0000000001
- Amount: Any amount

---

## 🗄️ Database Migration

### Step 1: Update Prisma Schema

Add the payment schema to your `prisma/schema.prisma`:

```prisma
// Copy content from payment-schema.prisma file

// Then run migration:
npx prisma migrate dev --name add_payment_system
```

### Step 2: Push to Database

```bash
npx prisma db push
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

---

## 🔧 Integration Steps

### Step 1: Install Dependencies

```bash
npm install stripe axios
# Already included: prisma
```

### Step 2: Copy Files to Project

```bash
# Copy payment configuration
cp payment-config.ts lib/payment/config.ts

# Copy payment service
cp payment-service.ts lib/payment/service.ts

# Copy checkout components
cp checkout-components.tsx components/checkout/

# Copy webhook handlers (copy route structure as needed)
cp webhooks-example.ts app/api/webhooks/
```

### Step 3: Update Orders Page

In `app/products/[id]/page.tsx`, add:

```tsx
import { recordRecentlyViewed } from '@/components/products/RecentlyViewed'

// In your component:
useEffect(() => {
  recordRecentlyViewed({
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.images[0],
  })
}, [product])
```

### Step 4: Create Checkout Page

Create `app/checkout/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import CurrencySelector from '@/components/checkout/CurrencySelector'
import { initiatePayment } from '@/lib/payment/service'
import { Currency, Region } from '@/lib/payment/config'

export default function CheckoutPage() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [region, setRegion] = useState<Region>('global')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [amount] = useState(100) // Get from cart

  async function handlePayment() {
    if (!selectedMethod) return

    const result = await initiatePayment({
      orderId: 'order_12345',
      amount,
      currency,
      provider: selectedMethod as any,
      customerEmail: 'customer@example.com',
      customerName: 'John Doe',
      items: [{ name: 'Product', amount, quantity: 1 }],
      region,
    })

    if (result.success) {
      // Redirect to payment provider
      window.location.href = result.transactionId
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Payment Method & Currency */}
        <div>
          <CurrencySelector
            amount={amount}
            selectedCurrency={currency}
            onCurrencyChange={setCurrency}
            region={region}
          />

          <PaymentMethodSelector
            currency={currency}
            region={region}
            amount={amount}
            selectedMethod={selectedMethod}
            onSelect={(method) => setSelectedMethod(method.id)}
          />
        </div>

        {/* Right: Order Summary */}
        <div className="bg-gray-50 p-6 rounded-2xl h-fit">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          
          <div className="space-y-3 pb-4 border-b">
            <div className="flex justify-between">
              <span>Product</span>
              <span>${amount}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg pt-4 mb-6">
            <span>Total</span>
            <span>{amount} {currency}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={!selectedMethod}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🧪 Testing

### Test All Payment Methods Locally

```bash
# Start dev server
npm run dev

# Go to checkout page
open http://localhost:3000/checkout

# Test with sandbox credentials from each provider
```

### Test Webhooks Locally

Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
```

---

## 🚀 Production Deployment

### Step 1: Get Production API Keys

- Switch from Sandbox/Test mode to **Production** in each provider's dashboard
- Update `.env.local` with production keys
- Get new webhook secrets

### Step 2: Update Environment Variables

```bash
# For Vercel (or your hosting):
vercel env add NEXT_PUBLIC_STRIPE_PUBLIC_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
# ... repeat for all providers
```

### Step 3: Update Webhook URLs

In each provider's dashboard:
- Change webhook URL from `localhost` to `https://yourdomain.com/api/webhooks/stripe`
- Update certificate for HTTPS (required!)

### Step 4: Enable SSL/TLS

All payment processing MUST be over HTTPS. Ensure your domain has:
- SSL certificate (Let's Encrypt, Cloudflare, etc.)
- Force HTTPS redirect

### Step 5: Security Checklist

- [ ] Hide all API keys in environment variables
- [ ] Enable webhook verification for all providers
- [ ] Add CSRF protection to forms
- [ ] Rate limit payment endpoints
- [ ] Log all payment events
- [ ] Monitor for fraud patterns
- [ ] Enable 2FA on provider dashboards
- [ ] Review API key permissions (use minimal required)
- [ ] Set up payment reconciliation job
- [ ] Create backup payment method

---

## 🔍 Troubleshooting

### Stripe Issues

**"Invalid API Key"**
- Check `STRIPE_SECRET_KEY` format (starts with `sk_`)
- Verify you're using production key in production

**Webhook not received**
- Check webhook URL is publicly accessible
- Verify webhook secret in `.env`
- Check Stripe webhook logs: https://dashboard.stripe.com/webhooks

### Flutterwave Issues

**"Encryption key required"**
- Get encryption key from Flutterwave dashboard
- Ensure it's in `.env` file

**Mobile Money not working**
- Verify phone number format (international)
- Check network availability in Uganda/Kenya

### PayPal Issues

**"Invalid Client ID"**
- Use sandbox credentials in development
- Verify credentials from developer dashboard

**Webhook verification fails**
- Ensure webhook secret is correct
- Check timestamp is within 5 minutes

### General Issues

**"Connection timeout"**
- Check API keys are correct
- Verify network connectivity
- Check provider status: [https://status.stripe.com](https://status.stripe.com)

**"Currency not supported"**
- Check currency code (USD, UGX, etc.)
- Verify currency is enabled in provider settings

---

## 📊 Monitoring & Analytics

### Track Payments

```tsx
// Log to your analytics service
analytics.track('payment_initiated', {
  provider: result.provider,
  amount: result.amount,
  currency: result.currency,
})
```

### Create Dashboard

Monitor payment metrics:
- Total revenue
- Success rate by provider
- Conversion rate
- Average transaction time
- Failed payment reasons

### Set Up Alerts

Alert when:
- Payment failure rate > 5%
- Webhook not received for 1 hour
- API latency > 5 seconds
- Unusual transaction amounts

---

## 📞 Support

- **Stripe Support**: https://support.stripe.com
- **PayPal Support**: https://www.paypal.com/en/smarthelp
- **Flutterwave Support**: https://support.flutterwave.com
- **Pesapal Support**: https://support.pesapal.com

---

## 🎓 Learn More

- [Stripe Documentation](https://stripe.com/docs)
- [PayPal API Reference](https://developer.paypal.com/api/)
- [Flutterwave API Docs](https://developer.flutterwave.io/)
- [Pesapal Integration Guide](https://developer.pesapal.com/)

---

**Your payment system is now ready for both local and global customers! 💳🌍**
