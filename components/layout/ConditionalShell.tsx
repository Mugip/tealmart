// components/layout/ConditionalShell.tsx
// Server component — reads the pathname at render time so no client JS needed.
// Renders the store Header + Footer only when the visitor is NOT on an /admin path.
import { headers } from 'next/headers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') ?? headersList.get('x-pathname') ?? ''

  // Next.js 14 exposes the matched pathname via the x-invoke-path header in the
  // edge runtime and middleware. If that's not present (local dev / Node runtime)
  // we fall back to x-pathname which our middleware injects below.
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    // Admin pages get bare children — AdminNav handles its own layout
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
