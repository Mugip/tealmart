// components/layout/CartDrawer.tsx

'use client'

import { useCart } from '@/lib/contexts/CartContext'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getSecureImageUrl } from '@/lib/imageUrl'

interface UpsellProduct {
  id: string
  title: string
  price: number
  images: string[]
}

export default function CartDrawer() {
  const { items, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem, addItem, total } = useCart()
  const router = useRouter()
  const { data: session } = useSession()

  const [upsells, setUpsells] = useState<UpsellProduct[]>([])
  const [loadingUpsells, setLoadingUpsells] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const activeImage = getSecureImageUrl(allImages[selectedImage] || product.images[0])

  // Fetch upsells
  useEffect(() => {
    if (isDrawerOpen) {
      setLoadingUpsells(true)
      const cartIds = items.map(i => i.id.split('-')[0])

      fetch(`/api/products/upsell?cartIds=${cartIds.join(',')}`)
        .then(res => res.json())
        .then(data => {
          setUpsells(data)
          setLoadingUpsells(false)
        })
        .catch(() => setLoadingUpsells(false))
    }
  }, [isDrawerOpen, items.length])

  const handleCheckout = async () => {
    setLoadingCheckout(true)

    if (session?.user) {
      setIsDrawerOpen(false)
      router.push('/checkout')
      return
    }

    try {
      const res = await fetch('/api/settings/public', { cache: 'no-store' })
      const data = await res.json()

      setIsDrawerOpen(false)

      if (data.allowGuestCheckout) {
        router.push('/checkout')
      } else {
        router.push('/auth/signin?callbackUrl=/checkout')
      }
    } catch {
      setIsDrawerOpen(false)
      router.push('/auth/signin?callbackUrl=/checkout')
    } finally {
      setLoadingCheckout(false)
    }
  }

  if (!isDrawerOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[110] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Your Shopping Bag</h2>
            <p className="text-xs text-gray-500">{items.length} items</p>
          </div>
          <button onClick={() => setIsDrawerOpen(false)}>
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="mx-auto text-gray-300" size={40} />
              <p className="text-gray-500 mt-4">Your bag is empty</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-20 h-20">
                  <Image src={getSecureImageUrl(image)} alt={`${product.title} - ${index + 1}`} fill className="object-cover rounded" />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="text-sm text-tiffany-600 font-bold">${item.price.toFixed(2)}</p>

                  <div className="flex justify-between mt-2">
                    <div className="flex items-center border rounded">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2">
                        {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                      </button>
                      <span className="px-2 text-xs">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2">
                        <Plus size={12} />
                      </button>
                    </div>

                    <button onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Upsells */}
          {upsells.length > 0 && (
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles size={14} /> Pairs well with...
              </h3>

              <div className="flex gap-3 overflow-x-auto mt-3">
                {upsells.map(product => (
                  <div key={product.id} className="w-28">
                    <div className="relative h-24">
                      <Image src={getSecureImageUrl(image)} alt={`${product.title} - ${index + 1}`} fill className="object-cover rounded" />
                    </div>

                    <p className="text-xs truncate">{product.title}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">${product.price}</span>
                      <button
                        onClick={() =>
                          addItem({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.images[0]
                          })
                        }
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
          <div className="p-5 border-t">
            <div className="flex justify-between mb-3">
              <span>Total</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loadingCheckout}
              className="w-full py-3 bg-tiffany-500 text-white rounded-xl font-bold flex justify-center items-center gap-2"
            >
              {loadingCheckout ? 'Loading...' : 'Checkout Now'}
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => {
                setIsDrawerOpen(false)
                router.push('/cart')
              }}
              className="w-full mt-2 text-sm text-gray-500"
            >
              View Cart
            </button>
          </div>
        )}
      </div>
    </>
  )
        }
