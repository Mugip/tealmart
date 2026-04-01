// app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'
import MaintenanceBanner from '@/components/admin/MaintenanceBanner'
import { headers, cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? ''

  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // ✅ Fetch session on the server
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <MaintenanceBanner />
      {/* Pass session to the Nav */}
      <AdminNav session={session} />

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
