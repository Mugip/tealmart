// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GlobalProviders from '@/components/providers/GlobalProviders'
import ConditionalShell from '@/components/layout/ConditionalShell'
import ErrorCatcher from '@/components/ErrorCatcher'
import { generateMetadata } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateMetadata({
  title: 'TealMart - Shop Quality Products at Amazing Prices',
  description: 'Discover trending products across fashion, electronics, home goods, and more.',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#14B8A6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" sizes="any" />
        <link rel="apple-touch-icon" type="image/svg+xml" href="/apple-touch-icon.svg" />
      </head>
      <body className={`${inter.className} overflow-x-hidden w-full max-w-[100vw]`}>
        <ErrorCatcher />
        <GlobalProviders>
          <ConditionalShell>{children}</ConditionalShell>
        </GlobalProviders>
      </body>
    </html>
  )
}
