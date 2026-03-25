// app/account/orders/page.tsx

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Truck, CheckCircle, XCircle, Clock, ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import toast from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  trackingNumber?: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: { id: string; title: string; images: string[] }
  }>
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:    <Clock className="text-yellow-500" size={18} />,
  PROCESSING: <Package className="text-blue-500" size={18} />,
  SHIPPED:    <Truck className="text-purple-500" size={18} />,
  DELIVERED:  <CheckCircle className="text-green-500" size={18} />,
  CANCELLED:  <XCircle className="text-red-500" size={18} />,
  REFUNDED:   <RefreshCw className="text-gray-500" size={18} />,
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
  REFUNDED:   'bg-gray-100 text-gray-800',
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin?callbackUrl=/account/orders')
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  const handleReorder = (e: React.MouseEvent, order: Order) => {
    e.preventDefault()
    order.items.forEach(item => {
      addItem({
        id: item.product.id,
        title: item.product.title,
        price: item.price,
        image: item.product.images[0] || '',
      })
    })
    toast.success(`${order.items.length} item${order.items.length !== 1 ? 's' : ''} added to cart!`)
    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-tiffany-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-tiffany-600 mb-3 transition-colors">
            <ArrowLeft size={16} /> Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Package size={56} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 text-sm mb-6">Start shopping to see your orders here</p>
            <Link href="/products" className="inline-block bg-tiffany-500 hover:bg-tiffany-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-tiffany-200 transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[order.status] || STATUS_COLOR.PENDING}`}>
                        {order.status}
                      </span>
                      {order.trackingNumber && (
                        <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                          🚚 Tracking available
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{order.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                  </div>
                </div>

                {/* Item thumbnails */}
                <div className="flex gap-2 px-5 pb-4 overflow-x-auto">
                  {order.items.slice(0, 5).map(item => (
                    <div key={item.id} className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.product.images[0] || '/placeholder.png'}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      {item.quantity > 1 && (
                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-xs font-bold px-1 rounded-tl">
                          ×{item.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                      +{order.items.length - 5}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {STATUS_ICON[order.status]}
                    <span className="font-medium">
                      {order.status === 'PROCESSING' && 'Being prepared'}
                      {order.status === 'SHIPPED' && 'In transit'}
                      {order.status === 'DELIVERED' && 'Delivered successfully'}
                      {order.status === 'PENDING' && 'Awaiting payment'}
                      {order.status === 'CANCELLED' && 'Cancelled'}
                      {order.status === 'REFUNDED' && 'Refunded'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={e => handleReorder(e, order)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-tiffany-600 hover:text-tiffany-700 bg-tiffany-50 hover:bg-tiffany-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ShoppingCart size={12} /> Reorder
                    </button>
                    <span className="text-xs font-medium text-tiffany-600">View details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
            }
