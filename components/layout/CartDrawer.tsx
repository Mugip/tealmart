// components/layout/CartDrawer.tsx
'use client'

import { useCart } from '@/lib/contexts/CartContext'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UpsellProduct {
  id: string
  title: string
  price: number
  images: string[]
}

export default function CartDrawer() {
  const { items, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem, addItem, total } = useCart()
  const router = useRouter()
  const [upsells, setUpsells] = useState<UpsellProduct[]>([])
  const [loadingUpsells, setLoadingUpsells] = useState(false)

  // Fetch upsells whenever the drawer opens or cart items change
  useEffect(() => {
    if (isDrawerOpen) {
      setLoadingUpsells(true)
      const cartIds = items.map(i => i.id.split('-')[0]) // Get base product IDs
      fetch(`/api/products/upsell?cartIds=${cartIds.join(',')}`)
        .then(res => res.json())
        .then(data => {
          setUpsells(data)
          setLoadingUpsells(false)
        })
        .catch(() => setLoadingUpsells(false))
    }
  }, [isDrawerOpen, items.length])

  if (!isDrawerOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-300"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-tiffany-100 p-2 rounded-lg">
              <ShoppingBag className="text-tiffany-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Shopping Bag</h2>
              <p className="text-xs text-gray-500">{items.length} items</p>
            </div>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Cart Items List */}
          <div className="p-5 space-y-5">
            {items.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-500 font-medium">Your bag is empty</p>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm"
                >
                  Shop Arrivals
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">{item.title}</h3>
                      <p className="text-tiffany-600 font-bold text-sm mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8 bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 hover:bg-white text-gray-500"> {item.quantity === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12}/>} </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-700">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 hover:bg-white text-gray-500"><Plus size={12}/></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* UPSELL SECTION */}
          {upsells.length > 0 && (
            <div className="mt-4 border-t border-dashed border-gray-200 pt-6 pb-10 bg-gray-50/50">
              <div className="px-5 mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-500 fill-yellow-500" />
                  Pairs well with...
                </h3>
              </div>
              
              <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
                {upsells.map((product) => (
                  <div key={product.id} className="w-32 flex-shrink-0 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50">
                      <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 line-clamp-1 h-3">{product.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-tiffany-600">${product.price.toFixed(2)}</span>
                      <button 
                        onClick={() => addItem({ id: product.id, title: product.title, price: product.price, image: product.images[0] })}
                        className="bg-tiffany-500 text-white p-1 rounded-md hover:bg-tiffany-600 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 text-sm font-medium">Estimated Total</span>
              <span className="text-2xl font-black text-gray-900">${total.toFixed(2)}</span>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => { setIsDrawerOpen(false); router.push('/checkout'); }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Checkout Now <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => { setIsDrawerOpen(false); router.push('/cart'); }}
                className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                View Full Cart
              </button>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-400 font-medium">
              <span className="flex items-center gap-1 uppercase tracking-widest">🔒 Secure SSL</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1 uppercase tracking-widest">⚡ Fast Delivery</span>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </>
  )
}
