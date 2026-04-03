// components/checkout/PaymentSummary.tsx
'use client'

import { Loader2 } from 'lucide-react'

interface Props {
  subtotal: number
  shipping: number
  tax: number
  discountAmount: number
  discountCode: string | null
  total: number
  isCalculating: boolean
}

export default function PaymentSummary({ 
  subtotal, shipping, tax, discountAmount, discountCode, total, isCalculating 
}: Props) {
  
  const ValueDisplay = ({ value, isFree = false, isNegative = false }: { value: number, isFree?: boolean, isNegative?: boolean }) => {
    if (isCalculating) return <Loader2 size={14} className="animate-spin text-gray-400" />
    if (isFree && value === 0) return <span className="text-green-600 font-bold">FREE</span>
    return (
      <span className={isNegative ? "text-green-600 font-bold" : "text-gray-900 font-medium"}>
        {isNegative ? '-' : ''}${value.toFixed(2)}
      </span>
    )
  }

  return (
    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Subtotal</span>
        <ValueDisplay value={subtotal} />
      </div>
      
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Shipping</span>
        <ValueDisplay value={shipping} isFree={true} />
      </div>
      
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Estimated Tax</span>
        <ValueDisplay value={tax} />
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-green-600 font-medium items-center h-6">
          <span>Discount ({discountCode})</span>
          <ValueDisplay value={discountAmount} isNegative={true} />
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between font-black text-gray-900 text-base sm:text-lg items-center h-8">
        <span>Total</span>
        {isCalculating ? (
           <Loader2 size={18} className="animate-spin text-tiffany-600" />
        ) : (
           <span className="text-tiffany-600">${total.toFixed(2)}</span>
        )}
      </div>
    </div>
  )
}
