// lib/contexts/CurrencyContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type CurrencyContextType = {
  currency: string
  exchangeRate: number
  symbol: string
  setCurrency: (currency: string) => void
  formatPrice: (priceInUSD: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', UGX: 'USh ', EUR: '€', GBP: '£', KES: 'KSh ', NGN: '₦'
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const[currency, setCurrencyState] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [rates, setRates] = useState<Record<string, number>>({})
  const[isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    async function initializeCurrency() {
      try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD')
        const rateData = await rateRes.json()
        setRates(rateData.rates)

        const savedCurrency = localStorage.getItem('tealmart-currency')
        if (savedCurrency && rateData.rates[savedCurrency]) {
          setCurrencyState(savedCurrency)
          setExchangeRate(rateData.rates[savedCurrency])
          return
        }

        const geoRes = await fetch('https://ipapi.co/json/')
        const geoData = await geoRes.json()
        const userCurrency = geoData.currency
        if (userCurrency && rateData.rates[userCurrency]) {
          setCurrencyState(userCurrency)
          setExchangeRate(rateData.rates[userCurrency])
        }
      } catch (error) {
        console.error('Currency init failed:', error)
      }
    }
    initializeCurrency()
  },[])

  const setCurrency = (newCurrency: string) => {
    if (rates[newCurrency] || newCurrency === 'USD') {
      setCurrencyState(newCurrency)
      setExchangeRate(rates[newCurrency] || 1)
      localStorage.setItem('tealmart-currency', newCurrency)
    }
  }

  const formatPrice = (priceInUSD: number) => {
    // Avoid hydration mismatch by returning USD on first server render
    if (!isMounted) return `$${priceInUSD.toFixed(2)}`

    const converted = priceInUSD * exchangeRate
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `

    if (['UGX', 'RWF', 'KES'].includes(currency)) {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    return `${symbol}${converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, symbol: CURRENCY_SYMBOLS[currency] || currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider')
  return context
}
