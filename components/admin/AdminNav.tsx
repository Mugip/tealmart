// components/admin/AdminNav.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Boxes, Settings, LogOut, Menu, X, ShoppingBag,
} from 'lucide-react'

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => {
        if (!r.ok) {
          setAuthed(false)
          router.replace('/admin/login')
          return null
        }
        return r.json()
      })
      .then(data => {
        if (data?.email) {
          setAdminEmail(data.email)
          setAuthed(true)
        }
      })
      .catch(() => {
        setAuthed(false)
        router.replace('/admin/login')
      })
  }, [router])

  if (authed !== true) return null

  const navItems =[
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { href: '/admin/products', icon: Package, label: 'Products' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/inventory', icon: Boxes, label: 'Inventory' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map(item => {
        const Icon = item.icon
        const active = isActive(item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              active
                ? 'bg-tiffany-50 text-tiffany-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 bg-tiffany-600 rounded-full" />}
          </Link>
        )
      })}
    </nav>
  )

  const UserFooter = () => (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-3 px-4 py-2 mb-2">
        <div className="w-8 h-8 bg-tiffany-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-tiffany-700 font-semibold text-sm">
            {adminEmail.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
          <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
        </div>
      </div>
      <button onClick={handleLogout} disabled={loggingOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
        <LogOut className="w-5 h-5" />
        <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
      </button>
      <Link href="/" className="block text-center text-sm text-tiffany-600 hover:text-tiffany-700 mt-3">
        ← Back to Store
      </Link>
    </div>
  )

  return (
    <>
      <div className="lg:hidden fixed left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm" style={{ top: 'var(--banner-h, 0px)' }}>
        <div className="flex items-center justify-between p-4">
          
          {/* ADMIN MOBILE LOGO FIXED */}
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo.svg" alt="TealMart Admin" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold text-gray-900">TealMart Admin</span>
          </Link>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" style={{ top: 'calc(var(--banner-h, 0px) + 64px)' }} onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`lg:hidden fixed left-0 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-200 z-40 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ top: 'calc(var(--banner-h, 0px) + 64px)' }}>
        <NavLinks onClick={() => setMobileMenuOpen(false)} />
        <UserFooter />
      </aside>

      <aside className="hidden lg:flex fixed left-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-40 flex-col" style={{ top: 'var(--banner-h, 0px)' }}>
        <div className="p-6 border-b border-gray-200">
          
          {/* ADMIN DESKTOP LOGO FIXED */}
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo.svg" alt="TealMart Admin" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">TealMart</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
          
        </div>
        <NavLinks />
        <UserFooter />
      </aside>
    </>
  )
          }
