// components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Boxes, Settings, Tag, ExternalLink, Users, DollarSign, Activity, ShieldCheck, LogOut, Image as ImageIcon
} from 'lucide-react'
import type { AdminSession } from '@/lib/adminAuth'

const ALL_NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', exact: true },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', id: 'orders' },
  { href: '/admin/products', icon: Package, label: 'Products', id: 'products' },
  { href: '/admin/inventory', icon: Boxes, label: 'Inventory', id: 'inventory' },
  { href: '/admin/discounts', icon: Tag, label: 'Discounts', id: 'discounts' },
  { href: '/admin/subscribers', icon: Users, label: 'Subscribers', id: 'subscribers' },
  { href: '/admin/pricing', icon: DollarSign, label: 'Pricing Rules', id: 'pricing' },
  { href: '/admin/logs', icon: Activity, label: 'Ingest Logs', id: 'logs' },
  { href: '/admin/media', icon: ImageIcon, label: 'Media & CDN', id: 'settings' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { href: '/admin/staff', icon: ShieldCheck, label: 'Staff Access', id: 'staff' },
  { href: '/admin/settings', icon: Settings, label: 'Settings', id: 'settings' },
]

export default function AdminNav({ session }: { session: AdminSession | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (session?.permissions.includes('all')) return true;
    if (item.id === 'dashboard') return true;
    return session?.permissions.includes(item.id);
  })

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 z-40">
        <div className="px-6 py-6 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo.svg" alt="TealMart" className="h-8 w-auto" />
            <div>
              <p className="font-black text-gray-900 text-base leading-none">TealMart</p>
              <p className="text-[10px] text-tiffany-600 font-bold uppercase tracking-widest leading-none mt-1">
                {session?.role === 'admin' ? 'Super Admin' : 'Staff Member'}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-tiffany-50 text-tiffany-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className={active ? 'text-tiffany-600' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
          <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-tiffany-600 font-semibold transition-colors">
            <ExternalLink size={16} /> View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ✅ FIXED: Mobile Top Bar (Adapts to banner height) */}
      <header 
        className="lg:hidden fixed left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between shadow-sm"
        style={{ top: 'var(--banner-h, 0px)' }}
      >
        <Link href="/admin" className="flex items-center gap-2">
          <img src="/logo.svg" alt="TealMart" className="h-7 w-auto" />
          <span className="font-black text-gray-900">Admin</span>
        </Link>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
          <LogOut size={20}/>
        </button>
      </header>

      {/* ✅ FIXED: Mobile Scrollable Nav (Sits exactly below the Top Bar) */}
      <div 
        className="lg:hidden fixed left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-30 px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide shadow-sm"
        style={{ top: 'calc(var(--banner-h, 0px) + 64px)' }}
      >
         {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  active 
                    ? 'bg-tiffany-50 text-tiffany-700 border-tiffany-200 shadow-sm' 
                    : 'text-gray-600 bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <item.icon size={14} className={active ? 'text-tiffany-600' : 'text-gray-400'} /> {item.label}
              </Link>
            )
          })}
      </div>
    </>
  )
}
