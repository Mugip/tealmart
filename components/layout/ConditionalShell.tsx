// components/layout/ConditionalShell.tsx
// Server component — reads x-pathname (injected by middleware) at render time.
// Sole responsibility: suppress store Header/Footer on /admin routes.
// Maintenance mode enforcement is handled entirely by middleware, which runs
// before this component and redirects before any page HTML is generated.
import { headers } from 'next/headers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''

  // Admin pages: bare render — AdminNav provides its own layout
  if (pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  // Store pages: wrap with Header + Footer
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
