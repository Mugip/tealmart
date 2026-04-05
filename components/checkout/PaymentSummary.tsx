// components/checkout/PaymentSummary.tsx
'use client'

interface Props {
  step: number
  subtotal: number
  shipping: number
  tax: number
  discountAmount: number
  discountCode: string | null
  total: number
}

export default function PaymentSummary({ 
  step, subtotal, shipping, tax, discountAmount, discountCode, total 
}: Props) {
  
  // If we are on step 1, shipping and tax are not finalized
  const isStep1 = step === 1;

  const ValueDisplay = ({ value, isFree = false, isNegative = false }: { value: number, isFree?: boolean, isNegative?: boolean }) => {
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
        {isStep1 ? (
          <span className="text-gray-400 text-xs italic">Calculated at next step</span>
        ) : (
          <ValueDisplay value={shipping} isFree={true} />
        )}
      </div>
      
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Estimated Tax</span>
        {isStep1 ? (
          <span className="text-gray-400 text-xs italic">Calculated at next step</span>
        ) : (
          <ValueDisplay value={tax} />
        )}
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-green-600 font-medium items-center h-6">
          <span>Discount ({discountCode})</span>
          <ValueDisplay value={discountAmount} isNegative={true} />
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between font-black text-gray-900 text-base sm:text-lg items-center h-8">
        <span>Total</span>
        {isStep1 ? (
          <span className="text-gray-500 text-sm font-medium">Pending...</span>
        ) : (
          <span className="text-tiffany-600">${total.toFixed(2)}</span>
        )}
      </div>
    </div>
  )
}
