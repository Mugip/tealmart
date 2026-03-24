// app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'
import MaintenanceBanner from '@/components/admin/MaintenanceBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/*
        MaintenanceBanner is fixed z-[60] and sets --banner-h on <html>.
        AdminNav reads --banner-h to offset its own fixed positions so it
        sits below the banner rather than overlapping it.
      */}
      <MaintenanceBanner />
      <AdminNav />

      {/*
        Main content:
        - Mobile: needs top padding for the fixed mobile nav bar (64px) + banner
          We use pt-16 as the base for the nav bar; the banner adds itself via
          inline style on a wrapper div in the page.
        - Desktop: lg:ml-64 for the sidebar, no top padding needed.
      */}
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
