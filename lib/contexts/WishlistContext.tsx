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

  // Sync with DB when session available
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
