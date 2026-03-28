// lib/contexts/CurrencyContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyContextType = {
  currency: string
  exchangeRate: number
  symbol: string
  setCurrency: (currency: string) => void
  formatPrice: (priceInUSD: number) => string
  availableCurrencies: string[]
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', UGX: 'USh ', EUR: '€', GBP: '£', KES: 'KSh ', 
  NGN: '₦', ZAR: 'R ', RWF: 'FRw ', CAD: 'CA$', AUD: 'A$'
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const[rates, setRates] = useState<Record<string, number>>({})
  const [isMounted, setIsMounted] = useState(false)

  // 1. Fetch live exchange rates & detect user location on mount
  useEffect(() => {
    setIsMounted(true)
    
    async function initializeCurrency() {
      try {
        // Fetch live exchange rates (Free API, no key required)
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD')
        const rateData = await rateRes.json()
        setRates(rateData.rates)

        // Check if user manually selected a currency previously
        const savedCurrency = localStorage.getItem('tealmart-currency')
        if (savedCurrency && rateData.rates[savedCurrency]) {
          setCurrencyState(savedCurrency)
          setExchangeRate(rateData.rates[savedCurrency])
          return
        }

        // If no saved preference, auto-detect from IP (Free API)
        const geoRes = await fetch('https://ipapi.co/json/')
        const geoData = await geoRes.json()
        
        const userCurrency = geoData.currency
        if (userCurrency && rateData.rates[userCurrency]) {
          setCurrencyState(userCurrency)
          setExchangeRate(rateData.rates[userCurrency])
        }
      } catch (error) {
        console.error('Failed to initialize currency:', error)
      }
    }

    initializeCurrency()
  },[])

  const setCurrency = (newCurrency: string) => {
    if (rates[newCurrency]) {
      setCurrencyState(newCurrency)
      setExchangeRate(rates[newCurrency])
      localStorage.setItem('tealmart-currency', newCurrency)
    }
  }

  const formatPrice = (priceInUSD: number) => {
    // Prevent Hydration errors by returning standard USD on server render
    if (!isMounted) return `$${priceInUSD.toFixed(2)}`

    const converted = priceInUSD * exchangeRate
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `

    // Format nicely based on currency (e.g. UGX doesn't use decimals)
    if (['UGX', 'RWF', 'KES'].includes(currency)) {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    
    return `${symbol}${converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        exchangeRate,
        symbol: CURRENCY_SYMBOLS[currency] || currency,
        setCurrency,
        formatPrice,
        availableCurrencies: Object.keys(CURRENCY_SYMBOLS)
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider')
  return context
}
