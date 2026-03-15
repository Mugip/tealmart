// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from '@/lib/contexts/CartContext'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ErrorCatcher from "@/components/ErrorCatcher"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TealMart - Your Premium Online Marketplace',
  description: 'Discover trending products at unbeatable prices. Shop electronics, fashion, home goods, and more.',
  keywords: 'online shopping, e-commerce, trending products, deals, marketplace',
  openGraph: {
    title: 'TealMart - Your Premium Online Marketplace',
    description: 'Discover trending products at unbeatable prices.',
    type: 'website',
  },
}

// Add viewport configuration
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
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
