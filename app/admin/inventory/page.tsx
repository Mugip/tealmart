// app/admin/inventory/page.tsx
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Package, Search, AlertTriangle, TrendingDown } from 'lucide-react'
import InventoryClient from '@/components/admin/InventoryClient'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; status?: string }
}) {
  const { search, category, status } = searchParams

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category && category !== 'all') {
    where.category = category
  }
  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  } else if (status === 'low-stock') {
    where.stock = { lte: 10 }
  }

  const [products, lowStockStats, totalStock] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { stock: 'asc' },
      take: 100,
    }),
    prisma.product.aggregate({
      _count: true,
      where: { stock: { lte: 10 } },
    }),
    prisma.product.aggregate({
      _sum: { stock: true },
    }),
  ])

  const lowStockCount = lowStockStats._count

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Monitor and manage product stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Showing</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Stock Units</p>
              <p className="text-2xl font-bold text-gray-900">{totalStock._sum.stock ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <form method="GET" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by product name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600 transition-colors font-medium text-sm"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { href: '/admin/inventory', label: 'All', match: !status },
              { href: '/admin/inventory?status=low-stock', label: `Low Stock (${lowStockCount})`, match: status === 'low-stock', danger: true },
              { href: '/admin/inventory?status=active', label: 'Active', match: status === 'active' },
              { href: '/admin/inventory?status=inactive', label: 'Inactive', match: status === 'inactive' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  item.match
                    ? item.danger
                      ? 'bg-red-500 text-white'
                      : 'bg-tiffany-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </form>
      </div>

      {/* Client section: checkboxes + bulk actions + table */}
      <InventoryClient products={products} />
    </div>
  )
}
