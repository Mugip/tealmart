// components/admin/AdminNav.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Boxes, Settings, Tag, ExternalLink, Users, Activity, DollarSign
} from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { href: '/admin/discounts', icon: Tag, label: 'Discounts' },
  { href: '/admin/subscribers', icon: Users, label: 'Subscribers' },
  { href: '/admin/pricing', icon: DollarSign, label: 'Pricing Rules' },
  { href: '/admin/logs', icon: Activity, label: 'Ingest Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 z-40">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo.svg" alt="TealMart" className="h-7 w-auto" />
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">TealMart</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none mt-0.5">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={17} className={active ? 'text-teal-600' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-semibold transition-colors"
          >
            <ExternalLink size={14} />
            View Storefront
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <img src="/logo.svg" alt="TealMart" className="h-7 w-auto" />
          <span className="font-black text-gray-900">Admin</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </header>
    </>
  )
}
