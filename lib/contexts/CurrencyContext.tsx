// lib/contexts/CurrencyContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyContextType = {
  currency: string
  exchangeRate: number
  symbol: string
  rates: Record<string, number> // ✅ Added this to fix the Type Error
  setCurrency: (currency: string) => void
  formatPrice: (priceInUSD: number) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  UG: 'UGX', KE: 'KES', NG: 'NGN', TZ: 'TZS', RW: 'RWF', 
  ZA: 'ZAR', GH: 'GHS', US: 'USD', GB: 'GBP', EU: 'EUR', 
  CA: 'CAD', AU: 'AUD', IN: 'INR', AE: 'AED'
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', UGX: 'USh ', EUR: '€', GBP: '£', KES: 'KSh ', 
  NGN: '₦', RWF: 'RF ', TZS: 'TSh ', ZAR: 'R ', GHS: 'GH₵'
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    async function initializeGlobalSettings() {
      try {
        // 1. Fetch Real-time Exchange Rates
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD')
        const rateData = await rateRes.json()
        const allRates = rateData.rates
        setRates(allRates)

        // 2. Check for manual user preference
        const savedCurrency = localStorage.getItem('tealmart-currency')
        if (savedCurrency && allRates[savedCurrency]) {
          setCurrencyState(savedCurrency)
          setExchangeRate(allRates[savedCurrency])
          setIsLoading(false)
          return
        }

        // 3. Auto-Detect Location via IP
        const geoRes = await fetch('https://ipapi.co/json/')
        const geoData = await geoRes.json()
        const detectedCurrency = COUNTRY_TO_CURRENCY[geoData.country_code] || geoData.currency || 'USD'
        
        if (allRates[detectedCurrency]) {
          setCurrencyState(detectedCurrency)
          setExchangeRate(allRates[detectedCurrency])
        }
      } catch (error) {
        console.error('Global Currency Engine Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeGlobalSettings()
  }, [])

  const setCurrency = (newCurrency: string) => {
    if (rates[newCurrency]) {
      setCurrencyState(newCurrency)
      setExchangeRate(rates[newCurrency])
      localStorage.setItem('tealmart-currency', newCurrency)
    }
  }

  const formatPrice = (priceInUSD: number) => {
    if (!isMounted) return `$${priceInUSD.toFixed(2)}`
    const converted = priceInUSD * exchangeRate
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `
    if (['UGX', 'RWF', 'TZS', 'NGN', 'KES', 'INR'].includes(currency)) {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    return `${symbol}${converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      exchangeRate, 
      rates, // ✅ Provided to context
      symbol: CURRENCY_SYMBOLS[currency] || currency, 
      setCurrency, 
      formatPrice,
      isLoading 
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider')
  return context
}
