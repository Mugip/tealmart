// app/account/orders/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      title: string
      images: string[]
    }
  }>
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={20} />
      case 'PROCESSING':
        return <Package className="text-blue-500" size={20} />
      case 'SHIPPED':
        return <Truck className="text-purple-500" size={20} />
      case 'DELIVERED':
        return <CheckCircle className="text-green-500" size={20} />
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="text-red-500" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-tiffany-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here!
            </p>
            <button
              onClick={() => router.push('/products')}
              className="btn-primary px-8 py-3"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => router.push(`/account/orders/${order.orderNumber}`)}
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Placed on {format(new Date(order.createdAt), 'PPP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-tiffany-600">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-600">
                          +{order.items.length - 4}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm font-medium text-gray-700">
                      {order.status === 'PROCESSING' && 'Being prepared'}
                      {order.status === 'SHIPPED' && 'In transit'}
                      {order.status === 'DELIVERED' && 'Delivered'}
                      {order.status === 'PENDING' && 'Payment pending'}
                      {order.status === 'CANCELLED' && 'Cancelled'}
                    </span>
                  </div>
                  <button className="text-tiffany-600 hover:text-tiffany-700 font-medium text-sm">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
