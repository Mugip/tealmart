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

  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MaintenanceBanner />
      <AdminNav session={session} />

      <main className="flex-1 lg:ml-64 relative">
        <div
          // ✅ FIXED: Uses 130px on mobile to clear the double-stacked header, 32px (pt-8) on desktop
          className="pt-[130px] lg:pt-8 px-0 sm:px-6 lg:px-8 pb-12"
          style={{ marginTop: 'var(--banner-h, 0px)' }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
