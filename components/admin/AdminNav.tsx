// components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Boxes, Settings, Tag, ExternalLink, Users, DollarSign, Activity, ShieldCheck, LogOut,
  Image as ImageIcon, Globe, AlertCircle, Bell // ✅ CHANGED: ArrowRightRight to Globe
} from 'lucide-react'
import type { AdminSession } from '@/lib/adminAuth'

const ALL_NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', exact: true },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', id: 'orders' },
  { href: '/admin/cj-orders', icon: Globe, label: 'CJ Dropshipping', id: 'orders' }, // ✅ FIXED ICON
  { href: '/admin/disputes', icon: AlertCircle, label: 'Returns', id: 'orders' }, 
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

// ... (KEEP THE REST OF THE FILE EXACTLY THE SAME)

export default function AdminNav({ session }: { session: AdminSession | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showBellMenu, setShowBellMenu] = useState(false)

  useEffect(() => {
    const fetchNotifs = () => {
      fetch('/api/admin/notifications')
        .then(res => res.json())
        .then(data => { if (data.items) setNotifications(data.items) })
        .catch(() => {})
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60000) 
    return () => clearInterval(interval)
  }, [])

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

  const NotificationBell = () => (
    <div className="relative">
      <button 
        onClick={() => setShowBellMenu(!showBellMenu)}
        className="p-2 text-gray-500 hover:text-tiffany-600 transition-colors relative"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {showBellMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2 border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-500">All caught up! No new alerts.</div>
          ) : (
            notifications.map((n, i) => (
              <Link key={i} href={n.link} onClick={() => setShowBellMenu(false)} className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                <p className="text-xs font-bold text-gray-900">{n.message}</p>
                <span className="text-[10px] text-tiffany-600 font-semibold mt-1 inline-block">Review now →</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 z-40">
        <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo.svg" alt="TealMart" className="h-8 w-auto" />
            <div>
              <p className="font-black text-gray-900 text-base leading-none">TealMart</p>
              <p className="text-[10px] text-tiffany-600 font-bold uppercase tracking-widest leading-none mt-1">
                {session?.role === 'admin' ? 'Super Admin' : 'Staff Member'}
              </p>
            </div>
          </Link>
          <NotificationBell />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar pb-24">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-tiffany-50 text-tiffany-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon size={18} className={active ? 'text-tiffany-600' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full px-4 py-4 border-t border-gray-100 bg-white">
          <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-tiffany-600 font-semibold transition-colors mb-1">
            <ExternalLink size={16} /> View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed left-0 right-0 z-40 flex flex-col shadow-sm" style={{ top: 'var(--banner-h, 0px)' }}>
        <header className="bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo.svg" alt="TealMart" className="h-7 w-auto" />
            <span className="font-black text-gray-900">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
              <LogOut size={20}/>
            </button>
          </div>
        </header>

        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
           {navItems.map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${active ? 'bg-tiffany-50 text-tiffany-700 border-tiffany-200 shadow-sm' : 'text-gray-600 bg-white border-gray-100 hover:bg-gray-50'}`}>
                  <item.icon size={14} className={active ? 'text-tiffany-600' : 'text-gray-400'} /> {item.label}
                </Link>
              )
            })}
        </div>
      </div>
    </>
  )
        }
