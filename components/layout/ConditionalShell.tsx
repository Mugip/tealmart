// components/layout/ConditionalShell.tsx
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/adminAuth'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default async function ConditionalShell({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''

  // 1. Admin bypass (Admin panel handles its own layout)
  if (pathname.startsWith('/admin')) {
    return <>{children}</>
  }

  // 2. ✅ BULLETPROOF SERVER-SIDE MAINTENANCE CHECK
  let isMaintenance = false;
  try {
    const settings = await prisma.adminSettings.findFirst({ select: { maintenanceMode: true } });
    isMaintenance = settings?.maintenanceMode ?? false;
  } catch(e) {}

  // Check if current user is an authenticated admin
  let isAdmin = false;
  const adminToken = cookies().get('admin-auth')?.value;
  if (adminToken) {
    isAdmin = await verifyAdminToken(adminToken);
  }

  // 3. Block Visitors
  const isExempt = pathname.startsWith('/auth/') || pathname.includes('_next') || pathname.includes('favicon.ico')
  
  if (isMaintenance && !isAdmin && !isExempt && pathname !== '/maintenance') {
    redirect('/maintenance'); // Force redirect on the server
  }

  // If we are already on the maintenance page, just render it without Header/Footer
  if (pathname === '/maintenance') {
    return <>{children}</>
  }

  // 4. Normal Store Render
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
