// app/admin/products/page.tsx - WORKING EDIT/DELETE + PAGINATION
import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Plus, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import DeleteProductButton from '@/components/admin/DeleteProductButton'

const PER_PAGE = 50

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const search = searchParams.search ?? ''
  const categoryFilter = searchParams.category ?? ''

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (categoryFilter) {
    where.category = categoryFilter
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ['category'], _count: true, orderBy: { _count: { category: 'desc' } }, take: 20 }),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter) params.set('category', categoryFilter)
    params.set('page', String(p))
    return `/admin/products?${params.toString()}`
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 text-sm mt-1">
            {total} total products · page {page} of {totalPages}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600 transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search products..."
          className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
        />
        <select
          name="category"
          defaultValue={categoryFilter}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.category} value={c.category}>
              {c.category} ({c._count})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
        >
          Filter
        </button>
        {(search || categoryFilter) && (
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No products found.{' '}
                    <Link href="/admin/products/new" className="text-tiffany-600 hover:underline">
                      Add one?
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm line-clamp-2 max-w-xs">{product.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{product.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                      {product.costPrice && (
                        <p className="text-xs text-gray-400">Cost: ${product.costPrice.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      <span className={product.stock <= 5 ? 'text-red-600 font-semibold' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.isActive ? <Eye size={10} /> : <EyeOff size={10} />}
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-tiffany-600 hover:text-tiffany-800 transition-colors"
                          title="Edit product"
                        >
                          <Edit size={16} />
                        </Link>
                        <DeleteProductButton productId={product.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={buildUrl(page - 1)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <ChevronLeft size={18} />
                </Link>
              ) : (
                <span className="p-1.5 text-gray-300">
                  <ChevronLeft size={18} />
                </span>
              )}
              <span className="text-sm text-gray-700">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={buildUrl(page + 1)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <ChevronRight size={18} />
                </Link>
              ) : (
                <span className="p-1.5 text-gray-300">
                  <ChevronRight size={18} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
          }
