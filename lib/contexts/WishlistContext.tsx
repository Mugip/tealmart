// lib/contexts/WishlistContext.tsx

'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

type WishlistContextType = {
  wishlistIds: Set<string>
  toggle: (productId: string, productTitle?: string) => void
  isWishlisted: (productId: string) => boolean
  loading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const STORAGE_KEY = 'tealmart-wishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setWishlistIds(new Set(JSON.parse(stored)))
      }
    } catch {}
  }, [])

  // Sync with DB when session available and merge local items
  useEffect(() => {
    if (!session?.user?.id) return
    setLoading(true)

    fetch('/api/wishlist')
      .then(r => r.json())
      .then(async (data) => {
        if (Array.isArray(data)) {
          const dbIds = new Set<string>(data.map((w: any) => w.productId))
          
          // ✅ NEW: Get local items and merge them into the DB
          const localIds = new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
          const itemsToSync = [...localIds].filter(id => !dbIds.has(id))

          for (const id of itemsToSync) {
            try {
              await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: id }),
              })
              dbIds.add(id)
            } catch {}
          }

          setWishlistIds(dbIds)
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...dbIds]))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  const toggle = useCallback(async (productId: string, productTitle?: string) => {
    const isCurrentlyWishlisted = wishlistIds.has(productId)

    // Optimistic update
    setWishlistIds(prev => {
      const next = new Set(prev)
      if (isCurrentlyWishlisted) {
        next.delete(productId)
        toast('Removed from wishlist', { icon: '💔' })
      } else {
        next.add(productId)
        toast.success('Added to wishlist! ❤️')
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })

    // Sync with DB if logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/wishlist', {
          method: isCurrentlyWishlisted ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
      } catch {}
    }
  }, [wishlistIds, session?.user?.id])

  const isWishlisted = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds])

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within WishlistProvider')
  return context
        }
