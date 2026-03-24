// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from '@/lib/contexts/CartContext'
import ConditionalShell from '@/components/layout/ConditionalShell'
import ErrorCatcher from '@/components/ErrorCatcher'
import CookieConsent from '@/components/CookieConsent'
import { generateMetadata } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateMetadata({
  title: 'TealMart - Shop Quality Products at Amazing Prices',
  description:
    'Discover trending products across fashion, electronics, home goods, and more. Free shipping on orders over $50. 30-day money-back guarantee.',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className={inter.className}>
        <ErrorCatcher />
        <SessionProvider>
          <CartProvider>
            {/*
              ConditionalShell reads the current pathname on the server and
              renders Header + Footer only when NOT on an /admin route.
              This eliminates the collision between the store header and
              the admin sidebar.
            */}
            <ConditionalShell>{children}</ConditionalShell>
            <Toaster position="top-right" />
            <CookieConsent />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
