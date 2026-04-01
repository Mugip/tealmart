// app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'
import MaintenanceBanner from '@/components/admin/MaintenanceBanner'
import { headers } from 'next/headers'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // ✅ Fix: Do not render the sidebar or margins on the login page
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MaintenanceBanner />
      <AdminNav />

      <main className="lg:ml-64 min-h-screen">
        <div
          className="lg:pt-0"
          style={{ paddingTop: 'calc(var(--banner-h, 0px) + 64px)' } as React.CSSProperties}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
