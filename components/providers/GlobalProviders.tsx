// components/providers/GlobalProviders.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/lib/contexts/CartContext'
import { WishlistProvider } from '@/lib/contexts/WishlistContext'
import { CurrencyProvider } from '@/lib/contexts/CurrencyContext'
import { Toaster } from 'react-hot-toast'
import CookieConsent from '@/components/CookieConsent'

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster position="top-right" />
            <CookieConsent />
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </SessionProvider>
  )
}
