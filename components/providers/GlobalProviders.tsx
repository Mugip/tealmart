// components/providers/GlobalProviders.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/lib/contexts/CartContext'
import { WishlistProvider } from '@/lib/contexts/WishlistContext'
import { CurrencyProvider } from '@/lib/contexts/CurrencyContext'
import { Toaster } from 'react-hot-toast'
import CookieConsent from '@/components/CookieConsent'
import CartDrawer from '@/components/layout/CartDrawer'
import ChatBot from '@/components/layout/ChatBot'
import MaintenanceWatcher from '@/components/layout/MaintenanceWatcher' // ✅ Import Watcher

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
            <CookieConsent />
            <CartDrawer />
            <ChatBot />
            <MaintenanceWatcher />
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </SessionProvider>
  )
}
