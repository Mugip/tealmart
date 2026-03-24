// app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'
import MaintenanceBanner from '@/components/admin/MaintenanceBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Persistent red banner when maintenance mode is active */}
      <MaintenanceBanner />

      {/* Sidebar navigation */}
      <AdminNav />

      {/* Main content — offset left on desktop for sidebar, offset top on mobile for fixed header */}
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
