// lib/contexts/CurrencyContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyContextType = {
  currency: string
  exchangeRate: number
  symbol: string
  rates: Record<string, number>
  getFlag: (currencyCode: string) => string
  setCurrency: (currency: string) => void
  formatPrice: (priceInUSD: number) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Mapping for regional or non-standard currency-to-country codes
const CURRENCY_TO_COUNTRY_OVERRIDES: Record<string, string> = {
  EUR: 'EU', // European Union
  XAF: 'CM', // Central African CFA (Cameroon)
  XOF: 'SN', // West African CFA (Senegal)
  XCD: 'AG', // East Caribbean Dollar
  ANG: 'CW', // Netherlands Antillean Guilder
  BTC: '₿',  // Bitcoin
  ETH: 'Ξ',  // Ethereum
}

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

        // Detect Location via IP
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

  // ✅ Programmatic Flag Logic: Converts "UGX" -> "UG" -> "🇺🇬"
  const getFlag = (currencyCode: string) => {
    if (!currencyCode) return '🌐'
    
    // Check overrides first (Regional currencies)
    let countryCode = CURRENCY_TO_COUNTRY_OVERRIDES[currencyCode]
    
    // Default: Take first two letters of currency code (ISO Standard)
    if (!countryCode) {
      countryCode = currencyCode.substring(0, 2)
    }

    // If it's a crypto symbol, return it directly
    if (countryCode.length !== 2) return countryCode

    // Transform country code to Emoji Flag
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) => 
        String.fromCodePoint(char.charCodeAt(0) + 127397)
      )
  }

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
