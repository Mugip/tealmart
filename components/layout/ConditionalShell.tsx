// components/layout/ConditionalShell.tsx
// Server component — runs at render time, before any client JS.
// 1. Suppresses store Header/Footer on /admin routes.
// 2. Enforces maintenance mode by reading the tealmart-maintenance cookie —
//    redirects store visitors before a single byte of the page renders.
//    This is the most reliable place to enforce it: server-side, no edge
//    runtime limitations, no race conditions, reads the cookie directly.
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''

  const isAdmin = pathname.startsWith('/admin')
  const isMaintenance = pathname.startsWith('/maintenance')
  const isApi = pathname.startsWith('/api')

  // ── Maintenance mode enforcement ─────────────────────────────────────────
  // Read the cookie that PUT /api/admin/settings writes when the admin saves.
  // Skip enforcement for: admin pages, the maintenance page itself, API routes.
  if (!isAdmin && !isMaintenance && !isApi) {
    const cookieStore = cookies()
    const maintenanceOn = cookieStore.get('tealmart-maintenance')?.value === '1'
    if (maintenanceOn) {
      redirect('/maintenance')
    }
  }

  // ── Admin pages: bare render, AdminNav handles its own layout ─────────────
  if (isAdmin) {
    return <>{children}</>
  }

  // ── Store pages: wrap with Header + Footer ────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
