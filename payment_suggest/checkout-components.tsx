// components/checkout/PaymentMethodSelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Building2, Globe, AlertCircle, CheckCircle } from 'lucide-react'
import { PAYMENT_CONFIG, getPaymentMethodsByRegion, Currency, Region } from '@/lib/payment/config'

interface PaymentMethod {
  id: string
  name: string
  provider: string
  icon: string
  description?: string
  fees?: string
}

interface PaymentMethodSelectorProps {
  currency: Currency
  region: Region
  amount: number
  onSelect: (method: PaymentMethod) => void
  selectedMethod?: string
}

export default function PaymentMethodSelector({
  currency,
  region,
  amount,
  onSelect,
  selectedMethod,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [showFeeInfo, setShowFeeInfo] = useState(false)

  useEffect(() => {
    const availableMethods = getPaymentMethodsByRegion(region)
    
    // Add fee information
    const methodsWithFees = availableMethods.map(method => ({
      ...method,
      fees: calculateFees(amount, method.provider),
      description: getMethodDescription(method.id),
    }))
    
    setMethods(methodsWithFees as PaymentMethod[])
  }, [region, amount])

  function calculateFees(amount: number, provider: string): string {
    const feePercentage = PAYMENT_CONFIG.fees[provider as keyof typeof PAYMENT_CONFIG.fees] || 0
    const fee = (amount * feePercentage) / 100
    return `+${fee.toFixed(2)} ${currency}`
  }

  function getMethodDescription(methodId: string): string {
    const descriptions: Record<string, string> = {
      stripe_card: 'Visa, Mastercard, American Express - Instant processing',
      paypal: 'PayPal Balance, PayPal Credit - Buyer protection included',
      mtn_money: 'MTN Mobile Money - Dial *165# or use USSD',
      airtel_money: 'Airtel Money - Send money easily from your phone',
      pesapal_bank: 'Bank transfer via Pesapal - Settlement in 24 hours',
      stripe_apple_pay: 'Apple Pay - Fast and secure with Face ID/Touch ID',
      stripe_google_pay: 'Google Pay - Quick payment with your saved cards',
      equity_bank: 'Equity Bank - Direct bank transfer or mobile banking',
    }
    return descriptions[methodId] || 'Payment method'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Payment Method</h3>
        <button
          onClick={() => setShowFeeInfo(!showFeeInfo)}
          className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
        >
          <AlertCircle size={14} />
          {showFeeInfo ? 'Hide fees' : 'Show fees'}
        </button>
      </div>

      {/* Currency Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💱 Currency: <span className="font-bold">{currency}</span> • Amount: <span className="font-bold">{amount.toFixed(2)} {PAYMENT_CONFIG.currencies[currency].symbol}</span>
        </p>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map(method => (
          <div
            key={method.id}
            onClick={() => onSelect(method)}
            className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedMethod === method.id
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-md'
            }`}
          >
            {/* Selected checkmark */}
            {selectedMethod === method.id && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                <CheckCircle size={18} className="text-white" />
              </div>
            )}

            {/* Icon */}
            <div className="text-2xl mb-2">{method.icon}</div>

            {/* Name */}
            <h4 className="font-bold text-gray-900 text-sm mb-1">{method.name}</h4>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-3 leading-tight">
              {method.description}
            </p>

            {/* Fees (if shown) */}
            {showFeeInfo && method.fees && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700">
                  Fee: <span className="text-red-600">{method.fees}</span>
                </p>
              </div>
            )}

            {/* Processing time */}
            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              {getProcessingTime(method.provider)}
            </div>
          </div>
        ))}
      </div>

      {/* Security Info */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
        <CreditCard className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-green-900">🔒 Secure Payment</p>
          <p className="text-xs text-green-800 mt-1">
            All payments are encrypted and secure. Your financial information is never stored on our servers.
          </p>
        </div>
      </div>

      {/* Regional Info */}
      {region === 'uganda' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-semibold text-amber-900 mb-2">📱 Local Payment Methods</p>
          <p className="text-xs text-amber-800">
            MTN and Airtel Money payments are the fastest for Uganda. Dial the USSD code from your registered phone to complete payment.
          </p>
        </div>
      )}

      {/* Refund Policy */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">💰 Refund Policy:</span> All payments are refundable within 30 days if you're not satisfied with your purchase.
        </p>
      </div>
    </div>
  )
}

function getProcessingTime(provider: string): string {
  const times: Record<string, string> = {
    stripe: 'Instant',
    paypal: '1-5 minutes',
    flutterwave: 'Instant',
    pesapal: '5-30 minutes',
  }
  return times[provider] || 'Processing...'
}

// ═══════════════════════════════════════════════════════════════════════════

// components/checkout/CurrencySelector.tsx
'use client'

import { useState } from 'react'
import { Globe, ArrowRightLeft } from 'lucide-react'
import { PAYMENT_CONFIG, Currency } from '@/lib/payment/config'
import { convertCurrency } from '@/lib/payment/service'

interface CurrencySelectorProps {
  amount: number
  selectedCurrency: Currency
  onCurrencyChange: (currency: Currency, convertedAmount: number) => void
  region: 'global' | 'uganda' | 'east_africa'
}

export default function CurrencySelector({
  amount,
  selectedCurrency,
  onCurrencyChange,
  region,
}: CurrencySelectorProps) {
  const [isConverting, setIsConverting] = useState(false)

  async function handleCurrencyChange(newCurrency: Currency) {
    if (newCurrency === selectedCurrency) return

    setIsConverting(true)
    try {
      const converted = await convertCurrency(amount, selectedCurrency, newCurrency)
      onCurrencyChange(newCurrency, converted)
    } catch (error) {
      console.error('Currency conversion error:', error)
    } finally {
      setIsConverting(false)
    }
  }

  // Get available currencies based on region
  const availableCurrencies = region === 'uganda' 
    ? ['UGX', 'USD'] as Currency[]
    : region === 'east_africa'
    ? ['KES', 'UGX', 'TZS', 'USD'] as Currency[]
    : ['USD', 'EUR', 'GBP'] as Currency[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Globe size={20} className="text-blue-600" />
          Currency
        </h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
          Live Rates
        </span>
      </div>

      {/* Currency Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {availableCurrencies.map(currency => {
          const config = PAYMENT_CONFIG.currencies[currency]
          return (
            <button
              key={currency}
              onClick={() => handleCurrencyChange(currency)}
              disabled={isConverting}
              className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                selectedCurrency === currency
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isConverting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="text-xs font-bold text-gray-900">{currency}</div>
              <div className="text-xs text-gray-600">{config.symbol}</div>
            </button>
          )
        })}
      </div>

      {/* Exchange Rate Info */}
      <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
        <ArrowRightLeft size={16} className="text-gray-600" />
        <span className="text-xs text-gray-600">
          Rates updated in real-time. Final amount may vary based on payment provider rates.
        </span>
      </div>
    </div>
  )
}
