// app/admin/analytics/page.tsx
import { prisma } from '@/lib/db'
import { TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react'
import SalesChart from '@/components/admin/SalesChart'

export default async function AnalyticsPage() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Fetch analytics data
  const [orders, topProducts, categoryStats] = await Promise.all([
    // All orders with items
    prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),

    // Top selling products
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),

    // Category performance
    prisma.product.groupBy({
      by: ['category'],
      _count: true,
      _sum: { conversions: true },
    }),
  ])

  // Get product details for top products
  const topProductIds = topProducts.map((p) => p.productId)
  const productDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, title: true, price: true, images: true },
  })

  const productMap = new Map(productDetails.map((p) => [p.id, p]))

  const enrichedTopProducts = topProducts.map((p) => ({
    ...p,
    product: productMap.get(p.productId),
  }))

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Previous period comparison (30-60 days ago)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const previousOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      status: { not: 'CANCELLED' },
    },
  })

  const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
  const orderGrowth = previousOrders.length > 0 ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 : 0

  // Daily sales data for chart
  const dailySales = orders.reduce((acc: any, order) => {
    const date = new Date(order.createdAt).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, orders: 0 }
    }
    acc[date].revenue += order.total
    acc[date].orders += 1
    return acc
  }, {})

  const chartData = Object.values(dailySales)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Last 30 days performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`text-sm font-semibold ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`text-sm font-semibold ${orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {orderGrowth >= 0 ? '↑' : '↓'} {Math.abs(orderGrowth).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalOrders}</h3>
          <p className="text-sm text-gray-500 mt-1">Total Orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">${averageOrderValue.toFixed(2)}</h3>
          <p className="text-sm text-gray-500 mt-1">Average Order Value</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {orders.reduce((sum, o) => sum + o.items.length, 0)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Items Sold</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Over Time</h2>
        <SalesChart data={chartData as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
          <div className="space-y-4">
            {enrichedTopProducts.slice(0, 5).map((item, index) => (
              <div key={item.productId} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-tiffany-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-tiffany-700">#{index + 1}</span>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.images[0] ? (
                    <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.product?.title || 'Unknown Product'}</p>
                  <p className="text-sm text-gray-500">{item._sum.quantity} sold</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${((item.product?.price || 0) * (item._sum.quantity || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
          <div className="space-y-4">
            {categoryStats
              .sort((a, b) => b._count - a._count)
              .slice(0, 5)
              .map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">
                      {cat.category.replace(/-/g, ' ')}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-tiffany-500 h-2 rounded-full"
                        style={{
                          width: `${(cat._count / categoryStats.reduce((sum, c) => sum + c._count, 0)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-gray-900">{cat._count}</p>
                    <p className="text-xs text-gray-500">products</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
