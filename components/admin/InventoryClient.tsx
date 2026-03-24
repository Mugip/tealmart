// components/admin/InventoryClient.tsx
// Client wrapper that owns checkbox selection state for the inventory page.
// The inventory page is a Server Component, so selection logic lives here.
'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle } from 'lucide-react'
import BulkActionsBar from '@/components/admin/BulkActionsBar'

interface Product {
  id: string
  title: string
  description: string
  price: number
  costPrice: number | null
  compareAtPrice: number | null
  images: string[]
  category: string
  stock: number
  isActive: boolean
  isFeatured: boolean
}

export default function InventoryClient({ products }: { products: Product[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectAllRef = useRef<HTMLInputElement>(null)

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? products.map(p => p.id) : [])
  }

  const clearSelection = () => {
    setSelectedIds([])
    if (selectAllRef.current) selectAllRef.current.checked = false
  }

  return (
    <>
      <BulkActionsBar selectedIds={selectedIds} onClear={clearSelection} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="rounded border-gray-300 text-tiffany-600 focus:ring-tiffany-500"
                    onChange={e => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(product.id) ? 'bg-tiffany-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-tiffany-600 focus:ring-tiffany-500"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggle(product.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{product.title}</p>
                          <p className="text-xs text-gray-500 font-mono">{product.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {product.category.replace(/-/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold inline-flex items-center gap-1 ${
                          product.stock <= 5
                            ? 'text-red-600'
                            : product.stock <= 10
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {product.stock}
                        {product.stock <= 10 && <AlertTriangle className="w-3.5 h-3.5" />}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-tiffany-600 hover:text-tiffany-700 font-medium"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
