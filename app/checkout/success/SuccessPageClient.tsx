"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useCart } from "@/lib/contexts/CartContext"

export default function SuccessClient() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()

  useEffect(() => {
    const sessionId = searchParams.get("session_id")

    console.log("Stripe Success Page Loaded")
    console.log("Session ID:", sessionId)

    if (clearCart) {
      clearCart()
    }
  }, [searchParams, clearCart])

  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">
        Payment Successful 🎉
      </h1>

      <p className="text-gray-600">
        Your order has been received and is being processed.
      </p>
    </div>
  )
}
