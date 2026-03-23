// components/admin/ProductEditForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, Package } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  title: string
  description: string
  price: number
  costPrice: number | null
  compareAtPrice: number | null
  images: string[]
  category: string
  tags: string[]
  stock: number
  isActive: boolean
  isFeatured: boolean
}

export default function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description,
    price: product.price,
    costPrice: product.costPrice || 0,
    compareAtPrice: product.compareAtPrice || 0,
    stock: product.stock,
    category: product.category,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to update product')
        setLoading(false)
        return
      }

      setMessage('✓ Product updated successfully!')
      setTimeout(() => {
        router.push('/admin/products')
        router.refresh()
      }, 1500)
    } catch (error) {
      setMessage('Failed to update product')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        setMessage('Failed to delete product')
        setLoading(false)
        return
      }

      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      setMessage('Failed to delete product')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Images */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Product Images</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {product.images.slice(0, 4).map((image, index) => (
            <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image}
                alt={`${product.title} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compare At Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Status</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-tiffany-600 border-gray-300 rounded focus:ring-tiffany-500"
            />
            <div>
              <p className="font-medium text-gray-900">Active</p>
              <p className="text-sm text-gray-500">Product is visible on the storefront</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-5 h-5 text-tiffany-600 border-gray-300 rounded focus:ring-tiffany-500"
            />
            <div>
              <p className="font-medium text-gray-900">Featured</p>
              <p className="text-sm text-gray-500">Show in featured products section</p>
            </div>
          </label>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✓')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
          Delete Product
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-tiffany-500 text-white font-bold rounded-lg hover:bg-tiffany-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
