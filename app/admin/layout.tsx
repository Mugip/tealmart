// app/admin/layout.tsx
import AdminNav from '@/components/admin/AdminNav'
                                                      export default function AdminLayout({ children }: { children: React.ReactNode }) {                            return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}                            <AdminNav />
                                                            {/* Main Content */}
      <main className="flex-1 lg:ml-64">                      {children}
      </main>
    </div>                                              )
}
