// components/products/UpsellSection.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'

interface Product {
  id: string
  title: string
  price: number
  images: string[]
}

export default function UpsellSection({ currentCategoryId, excludeId }: { currentCategoryId: string, excludeId: string }) {
  const [upsells, setUpsells] = useState<Product[]>([])
  const { addItem } = useCart()

  useEffect(() => {
    // Fetch 3 related products from the same category
    fetch(`/api/products/${excludeId}/related?limit=3`)
      .then(res => res.json())
      .then(data => setUpsells(data.slice(0, 3)))
  }, [currentCategoryId, excludeId])

  if (upsells.length === 0) return null

  return (
    <div className="mt-12 bg-tiffany-50/50 rounded-3xl p-6 sm:p-8 border border-tiffany-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Plus className="text-tiffany-600" size={20} />
        Frequently Bought Together
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {upsells.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-row md:flex-col items-center gap-4">
            <div className="relative w-20 h-20 md:w-full md:aspect-square flex-shrink-0">
              <Image 
                src={product.images[0]} 
                alt={product.title} 
                fill 
                className="object-cover rounded-xl"
              />
            </div>
            
            <div className="flex-1 text-left md:text-center min-w-0">
              <Link href={`/products/${product.id}`} className="text-sm font-bold text-gray-900 line-clamp-1 hover:text-tiffany-600">
                {product.title}
              </Link>
              <p className="text-tiffany-600 font-bold mt-1">${product.price.toFixed(2)}</p>
              
              <button 
                onClick={() => addItem({ id: product.id, title: product.title, price: product.price, image: product.images[0] })}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-tiffany-600 transition-colors"
              >
                <Plus size={14} /> Add to Bundle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
