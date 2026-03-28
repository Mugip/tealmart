// lib/contexts/CurrencyContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyContextType = {
  currency: string
  exchangeRate: number
  symbol: string
  rates: Record<string, number>
  setCurrency: (currency: string) => void
  formatPrice: (priceInUSD: number) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', UGX: 'USh ', EUR: '€', GBP: '£', KES: 'KSh ', 
  NGN: '₦', RWF: 'RF ', TZS: 'TSh ', ZAR: 'R ', GHS: 'GH₵',
  INR: '₹', CAD: 'C$', AUD: 'A$', AED: 'د.إ'
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    async function initializeGlobal() {
      try {
        // 1. Fetch Exchange Rates
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD')
        const rateData = await rateRes.json()
        const allRates = rateData.rates
        setRates(allRates)

        // 2. Check for Manual Choice
        const saved = localStorage.getItem('tealmart-currency')
        if (saved && allRates[saved]) {
          setCurrencyState(saved)
          setExchangeRate(allRates[saved])
          setIsLoading(false)
          return
        }

        // 3. Geo-IP Detection (World-wide compatible)
        const geoRes = await fetch('https://ipapi.co/json/')
        const geoData = await geoRes.json()
        
        if (geoData.currency && allRates[geoData.currency]) {
          setCurrencyState(geoData.currency)
          setExchangeRate(allRates[geoData.currency])
        }
      } catch (error) {
        console.error('Geo-Currency Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeGlobal()
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
    
    // No decimals for high-value currencies (UGX, INR, etc)
    if (['UGX', 'RWF', 'TZS', 'NGN', 'KES', 'INR', 'JPY'].includes(currency)) {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    return `${symbol}${converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ 
      currency, exchangeRate, rates, symbol: CURRENCY_SYMBOLS[currency] || currency, 
      setCurrency, formatPrice, isLoading 
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
