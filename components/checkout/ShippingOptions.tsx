// components/checkout/ShippingOptions.tsx
'use client'

import { Truck, CheckCircle } from 'lucide-react'

export interface ShippingOption {
  id: string
  displayName: string
  tier: string
  icon: string
  price: number
  taxesFee?: number // ✅ Added
  estimatedDays: string // ✅ We will now use this
  description: string
}

interface Props {
  options: ShippingOption[]
  selectedId: string
  onSelect: (option: ShippingOption) => void
  isLoading: boolean
}

export default function ShippingOptions({ options, selectedId, onSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-gray-50 rounded-xl border-2 border-gray-100" />
        ))}
      </div>
    )
  }

  if (options.length === 0) return null

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4 animate-in fade-in">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Truck size={22} className="text-tiffany-600" /> Shipping Method
      </h2>
      <p className="text-sm text-gray-500 mb-4">Please select your preferred shipping speed.</p>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id
          return (
            <label 
              key={option.id} 
              className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-tiffany-500 bg-tiffany-50 shadow-sm' : 'border-gray-100 hover:border-tiffany-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="shipping_method" 
                  value={option.id} 
                  checked={isSelected} 
                  onChange={() => onSelect(option)} 
                  className="w-4 h-4 text-tiffany-600 border-gray-300 focus:ring-tiffany-500 mt-0.5 flex-shrink-0" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{option.icon}</span>
                    <p className="font-bold text-gray-900 text-sm">{option.displayName}</p>
                  </div>
                  {/* ✅ Show Delivery Days Clearly */}
                  <p className="text-xs font-bold text-tiffany-700 mt-1 bg-tiffany-50 inline-block px-2 py-0.5 rounded">
                    Est. Delivery: {option.estimatedDays}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 text-sm">
                  {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                </p>
                {isSelected && <CheckCircle size={16} className="text-tiffany-600 absolute -top-2 -right-2 bg-white rounded-full" />}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
