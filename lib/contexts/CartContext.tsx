// lib/contexts/CartContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

type CartItem = {
  id: string
  title: string
  price: number
  image: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 1. Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('tealmart-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Failed to parse cart", e)
      }
    }
    setIsMounted(true)
  }, [])

  // 2. Save cart to localStorage and sync with Abandoned Cart API
  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('tealmart-cart', JSON.stringify(items))

    // REVENUE FEATURE: Sync to DB if user is logged in
    const syncAbandonedCart = async () => {
      if (items.length > 0 && session?.user?.email) {
        try {
          await fetch('/api/abandoned-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.user.email,
              cartData: items
            })
          })
        } catch (e) { /* silent fail */ }
      }
    }

    const timer = setTimeout(syncAbandonedCart, 2000)
    return () => clearTimeout(timer)
  }, [items, session, isMounted])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id)
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    // AUTOMATION: Open the drawer immediately so user sees the result
    setIsDrawerOpen(true)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem('tealmart-cart')
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ 
        items, addItem, removeItem, updateQuantity, 
        clearCart, total, isDrawerOpen, setIsDrawerOpen 
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
                             }
