'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {

  const [items, setItems] = useState<CartItem[]>([])

  // ✅ Load cart safely
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return

      const savedCart = localStorage.getItem('tealmart-cart')

      if (!savedCart) return

      const parsed = JSON.parse(savedCart)

      if (Array.isArray(parsed)) {
        setItems(parsed)
      }
    } catch (err) {
      console.error('Failed to load cart', err)
      localStorage.removeItem('tealmart-cart')
    }
  }, [])

  // ✅ Save cart safely
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem('tealmart-cart', JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save cart', err)
    }
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {

      const existing = prev.find(i => i.id === item.id)

      if (existing) {
        toast.success('Updated quantity in cart')

        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }

      toast.success('Added to cart')

      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Removed from cart')
  }

  const updateQuantity = (id: string, quantity: number) => {

    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
    )
  }

  const clearCart = () => {
    setItems([])
    toast.success('Cart cleared')
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {

  const context = useContext(CartContext)

  if (!context) {
    console.warn('CartProvider missing — returning fallback')

    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      total: 0
    }
  }

  return context
}
