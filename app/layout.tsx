// app/layout.tsx - UPDATED WITH ALL IMPROVEMENTS
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from '@/lib/contexts/CartContext'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ErrorCatcher from "@/components/ErrorCatcher"
import CookieConsent from '@/components/CookieConsent'
import { generateMetadata } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateMetadata({
  title: 'TealMart - Shop Quality Products at Amazing Prices',
  description: 'Discover trending products across fashion, electronics, home goods, and more. Free shipping on orders over $50. 30-day money-back guarantee.',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className={inter.className}>
        <ErrorCatcher />
        <SessionProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" />
            <CookieConsent />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
