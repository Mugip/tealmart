// app/admin/page.tsx
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import { cookies } from 'next/headers'
import { getAdminSession } from '@/lib/adminAuth'

export default async function AdminDashboard() {
  // ✅ NEW: Fetch session to check permissions
  const token = cookies().get('admin-auth')?.value
  const session = token ? await getAdminSession(token) : null
  
  const hasPerm = (p: string) => session?.permissions.includes('all') || session?.permissions.includes(p)

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    recentOrders,
    revenue,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    hasPerm('orders') ? prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    }) : Promise.resolve([]),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } },
    }),
  ])

  const stats = [
    { name: 'Total Products', value: totalProducts, icon: Package, color: 'bg-blue-500' },
    { name: 'Active Products', value: activeProducts, icon: TrendingUp, color: 'bg-green-500' },
    { name: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'bg-purple-500' },
    { name: 'Revenue', value: `$${(revenue._sum.total || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-tiffany-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your TealMart store</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - ✅ Conditionally Rendered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {hasPerm('products') && (
            <Link href="/admin/products" className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:border-tiffany-300 transition-colors group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-tiffany-600">Manage Products</h3>
              <p className="text-gray-600 text-sm">Add, edit, or remove products</p>
            </Link>
          )}
          {hasPerm('orders') && (
            <Link href="/admin/orders" className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:border-tiffany-300 transition-colors group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-tiffany-600">View Orders</h3>
              <p className="text-gray-600 text-sm">Track and manage customer orders</p>
            </Link>
          )}
          {hasPerm('settings') && (
            <Link href="/admin/settings" className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:border-tiffany-300 transition-colors group">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-tiffany-600">Settings</h3>
              <p className="text-gray-600 text-sm">Configure pricing and automation</p>
            </Link>
          )}
        </div>

        {/* Recent Orders - ✅ Conditionally Rendered */}
        {hasPerm('orders') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
              }
