// app/account/page.tsx

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Heart,
  User,
  LogOut,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import { useWishlist } from '@/lib/contexts/WishlistContext'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: { quantity: number }[]
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { wishlistIds } = useWishlist()

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account')
    }
  }, [status, router])

  useEffect(() => {
    if (!session?.user?.id) return

    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data.slice(0, 3) : [])
        setLoadingOrders(false)
      })
      .catch(() => setLoadingOrders(false))
  }, [session?.user?.id])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-tiffany-600" />
      </div>
    )
  }

  if (!session) return null

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-5">
          <div className="flex-shrink-0">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover ring-4 ring-tiffany-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tiffany-400 to-tiffany-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-tiffany-100">
                {session.user?.name?.[0]?.toUpperCase() ||
                  session.user?.email?.[0]?.toUpperCase() ||
                  'U'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {session.user?.name || 'My Account'}
            </h1>
            <p className="text-sm text-gray-500 truncate">
              {session.user?.email}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/account/orders"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-tiffany-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-tiffany-50 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-tiffany-600" />
              </div>
              <ChevronRight
                size={16}
                className="text-gray-400 group-hover:text-tiffany-500 transition-colors"
              />
            </div>

            <div className="text-2xl font-bold text-gray-900">
              {orders.length > 0 ? orders.length : '—'}
            </div>
            <div className="text-sm text-gray-500 font-medium">Orders</div>
          </Link>

          <Link
            href="/account/wishlist"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-red-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Heart size={20} className="text-red-500" />
              </div>
              <ChevronRight
                size={16}
                className="text-gray-400 group-hover:text-red-400 transition-colors"
              />
            </div>

            <div className="text-2xl font-bold text-gray-900">
              {wishlistIds.size}
            </div>
            <div className="text-sm text-gray-500 font-medium">Wishlist</div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/account/orders"
              className="text-sm font-semibold text-tiffany-600 hover:text-tiffany-700"
            >
              View all
            </Link>
          </div>

          {loadingOrders ? (
            <div className="p-6 space-y-3">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="h-14 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingBag
                size={36}
                className="mx-auto text-gray-300 mb-3"
              />
              <p className="text-gray-500 font-medium text-sm">
                No orders yet
              </p>
              <Link
                href="/products"
                className="mt-3 inline-block text-tiffany-600 font-semibold text-sm hover:underline"
              >
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map(order => {
                const itemCount =
                  order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0

                return (
                  <Link
                    key={order.id}
                    href={`/account/orders`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Order #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                        {itemCount > 0 &&
                          ` · ${itemCount} item${
                            itemCount !== 1 ? 's' : ''
                          }`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          statusColors[order.status] ||
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.status}
                      </span>

                      <span className="font-bold text-gray-900 text-sm">
                        ${order.total.toFixed(2)}
                      </span>

                      <ChevronRight
                        size={14}
                        className="text-gray-300 group-hover:text-tiffany-500 transition-colors"
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Account</h2>
          </div>

          {[
            {
              href: '/account/orders',
              icon: <Package size={18} />,
              label: 'My Orders',
              sub: 'Track & manage orders',
            },
            {
              href: '/account/wishlist',
              icon: <Heart size={18} />,
              label: 'My Wishlist',
              sub: `${wishlistIds.size} saved items`,
            },
            {
              href: '/contact',
              icon: <User size={18} />,
              label: 'Help & Support',
              sub: 'Contact our team',
            },
          ].map(({ href, icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-tiffany-50 group-hover:text-tiffany-600 transition-colors flex-shrink-0">
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {label}
                </p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>

              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-tiffany-500 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
