// app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'
import MaintenanceBanner from '@/components/admin/MaintenanceBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Use a flex column so MaintenanceBanner naturally pushes everything down.
    // The banner must be OUTSIDE the lg:ml-64 main area so it spans full width
    // above both the mobile fixed header and the desktop sidebar.
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full-width maintenance banner — renders above the mobile fixed header */}
      <MaintenanceBanner />

      {/* Sidebar nav (fixed on desktop, slide-in on mobile) */}
      <AdminNav />

      {/* Main content */}
      <main className="lg:ml-64 flex-1">
        {/* pt-16 offsets the mobile fixed top bar; lg:pt-0 removes it on desktop */}
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
