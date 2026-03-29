// lib/contexts/CurrencyContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyContextType = {
  currency: string
  exchangeRate: number
  symbol: string
  rates: Record<string, number>
  getFlag: (code: string) => string // ✅ New helper
  setCurrency: (currency: string) => void
  formatPrice: (priceInUSD: number) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', UGX: '🇺🇬', EUR: '🇪🇺', GBP: '🇬🇧', KES: '🇰🇪', 
  NGN: '🇳🇬', RWF: '🇷🇼', TZS: '🇹🇿', ZAR: '🇿🇦', GHS: '🇬🇭',
  INR: '🇮🇳', CAD: '🇨🇦', AUD: '🇦🇺', AED: '🇦🇪', JPY: '🇯🇵',
  CNY: '🇨🇳',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', UGX: 'USh ', EUR: '€', GBP: '£', KES: 'KSh ', 
  NGN: '₦', RWF: 'RF ', TZS: 'TSh ', ZAR: 'R ', GHS: 'GH₵',
  INR: '🇮🇳', CAD: 'C$', AUD: 'A$', AED: 'د.إ'
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  UG: 'UGX', KE: 'KES', NG: 'NGN', TZ: 'TZS', RW: 'RWF', 
  ZA: 'ZAR', GH: 'GHS', US: 'USD', GB: 'GBP', EU: 'EUR'
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
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD')
        const rateData = await rateRes.json()
        const allRates = rateData.rates
        setRates(allRates)

        const saved = localStorage.getItem('tealmart-currency')
        if (saved && allRates[saved]) {
          setCurrencyState(saved)
          setExchangeRate(allRates[saved])
          setIsLoading(false)
          return
        }

        const geoRes = await fetch('https://ipapi.co/json/')
        const geoData = await geoRes.json()
        const detected = COUNTRY_TO_CURRENCY[geoData.country_code] || geoData.currency || 'USD'
        
        if (allRates[detected]) {
          setCurrencyState(detected)
          setExchangeRate(allRates[detected])
        }
      } catch (error) {
        console.error('Geo-Currency Error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    initializeGlobal()
  }, [])

  const getFlag = (code: string) => CURRENCY_FLAGS[code] || '🌐'

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
    if (['UGX', 'RWF', 'TZS', 'NGN', 'KES', 'INR', 'JPY'].includes(currency)) {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    return `${symbol}${converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ 
      currency, exchangeRate, rates, getFlag, symbol: CURRENCY_SYMBOLS[currency] || currency, 
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
