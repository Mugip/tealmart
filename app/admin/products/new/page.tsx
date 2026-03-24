// app/admin/products/new/page.tsx - CREATE NEW PRODUCT
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageInput, setImageInput] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    costPrice: '',
    compareAtPrice: '',
    stock: '0',
    category: '',
    tags: [] as string[],
    images: [] as string[],
    isActive: true,
    isFeatured: false,
  })

  const [tagInput, setTagInput] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const addImage = () => {
    const url = imageInput.trim()
    if (url && !formData.images.includes(url)) {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }))
      setImageInput('')
    }
  }

  const removeImage = (url: string) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter(i => i !== url) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Product title is required')
      return
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast.error('Valid price is required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create product')
        return
      }

      toast.success('Product created successfully!')
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'Electronics', 'Clothing', 'Home & Garden', 'Sports & Outdoors',
    'Beauty & Health', 'Toys & Games', 'Books', 'Automotive',
    'Kitchen', 'Office', 'Jewelry', 'Pet Supplies', 'Other',
  ]

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <Link
        href="/admin/products"
        className="inline-flex items-center text-tiffany-600 hover:text-tiffany-700 mb-4 text-sm"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Products
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 text-sm mt-1">Create a product manually</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">                                    <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Title <span className="text-red-500">*</span>                                                     </label>
            <input
              type="text"                                           name="title"
              value={formData.title}                                onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              placeholder="Enter product title"                   />
          </div>

          <div>                                                   <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>                         <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent resize-none"                   placeholder="Product description..."
            />                                                  </div>

          <div>                                                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500"
            >                                                       <option value="">Select category...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>                                        
        {/* Pricing */}                                       <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">                                    <h2 className="text-base font-semibold text-gray-900">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>                                                   <label className="block text-sm font-medium text-gray-700 mb-1">                                              Sale Price ($) <span className="text-red-500">*</span>
              </label>
              <input                                                  type="number"
                name="price"                                          value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                placeholder="0.00"                                  />
            </div>                                                <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
              <input
                type="number"                                         name="costPrice"
                value={formData.costPrice}                            onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                placeholder="0.00"
              />                                                  </div>
            <div>                                                   <label className="block text-sm font-medium text-gray-700 mb-1">Compare-at Price ($)</label>                <input
                type="number"
                name="compareAtPrice"                                 value={formData.compareAtPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Images</h2>                                           <div className="flex gap-2">
            <input                                                  type="url"
              value={imageInput}                                    onChange={e => setImageInput(e.target.value)}                                                               onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"                               placeholder="Paste image URL and press Add"                                                               />
            <button                                                 type="button"
              onClick={addImage}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >                                                       <Plus size={16} />
            </button>                                           </div>
          {formData.images.length > 0 && (                        <div className="flex flex-wrap gap-2">
              {formData.images.map((url, i) => (                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button                                                 type="button"
                    onClick={() => removeImage(url)}                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"                                                   >                                                       <X size={10} />
                  </button>                                           </div>
              ))}
            </div>                                              )}
        </div>
                                                              {/* Tags */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Tags</h2>
          <div className="flex gap-2">
            <input                                                  type="text"
              value={tagInput}                                      onChange={e => setTagInput(e.target.value)}                                                                 onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
              placeholder="Type a tag and press Add"
            />                                                    <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"                                              >                                                       <Plus size={16} />
            </button>
          </div>
          {formData.tags.length > 0 && (                          <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-tiffany-50 text-tiffany-700 text-xs rounded-full border border-tiffany-200">
                  {tag}                                                 <button type="button" onClick={() => removeTag(tag)}>                                                         <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}                                                  </div>

        {/* Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">                                    <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"                                       checked={formData.isActive}
              onChange={handleChange}                               className="w-4 h-4 text-tiffany-600 rounded border-gray-300 focus:ring-tiffany-500"                       />
            <span className="text-sm text-gray-700">Active (visible to customers)</span>                              </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"                                       name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="w-4 h-4 text-tiffany-600 rounded border-gray-300 focus:ring-tiffany-500"
            />
            <span className="text-sm text-gray-700">Featured (appears on homepage)</span>                             </label>                                            </div>
                                                              {/* Submit */}
        <div className="flex items-center gap-3">               <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={16} />
                Create Product
              </>
            )}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >                                                       Cancel
          </Link>
        </div>
      </form>                                             </div>
  )                                                   }
