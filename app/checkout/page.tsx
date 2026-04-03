// app/checkout/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCart } from '@/lib/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Truck, CreditCard, AlertCircle, MapPin, Tag, CheckCircle, ChevronDown, Loader2 } from 'lucide-react'
import { Country, State } from 'country-state-city'
import type { ICountry, IState } from 'country-state-city'
import toast from 'react-hot-toast'
import ShippingOptions, { ShippingOption } from '@/components/checkout/ShippingOptions'
import PaymentSummary from '@/components/checkout/PaymentSummary'

interface SavedAddress {
  id: string; name: string; address: string; city: string; state: string; zip: string; country: string; phone?: string; isDefault: boolean
}

// Custom hook to debounce rapid ZIP code typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function CheckoutPage() {
  const { items, total: subtotal } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'flutterwave'>('flutterwave')

  // Form State
  const [formData, setFormData] = useState({
    email: '', name: '', address: '', city: '', state: '', zip: '', country: 'UG', phone: '',
  })

  // Address Lookups
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null)
  const [states, setStates] = useState<IState[]>([])
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)

  // Discounts
  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discount, setDiscount] = useState<any>(null)

  // ✅ NEW: Dynamic Shipping & Tax States
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isFetchingShipping, setIsFetchingShipping] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)
  const [isFetchingTax, setIsFetchingTax] = useState(false)

  const countries = useMemo(() => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)), [])
  
  // Debounce the ZIP code so we don't spam the CJ API on every keystroke
  const debouncedZip = useDebounce(formData.zip, 800)

  // Init user data & default country
  useEffect(() => {
    if (session?.user?.email) setFormData(prev => ({ ...prev, email: prev.email || session.user!.email! }))
    const def = Country.getCountryByCode('UG') || Country.getCountryByCode('US')
    if (def) { setSelectedCountry(def); setStates(State.getStatesOfCountry(def.isoCode)) }
  }, [session])

  useEffect(() => {
    if (formData.country) {
      const country = Country.getCountryByCode(formData.country)
      setSelectedCountry(country || null)
      if (country) {
        const countryStates = State.getStatesOfCountry(country.isoCode)
        setStates(countryStates)
        if (formData.state && !countryStates.find(s => s.isoCode === formData.state)) {
          setFormData(prev => ({ ...prev, state: '' }))
        }
      }
    }
  }, [formData.country])

  // ✅ NEW: Fetch Live CJ Shipping Rates
  useEffect(() => {
    const fetchShipping = async () => {
      if (!formData.country || items.length === 0) return
      
      setIsFetchingShipping(true)
      try {
        const res = await fetch('/api/checkout/shipping-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, country: formData.country, zip: debouncedZip })
        })
        const data = await res.json()
        if (data.shippingOptions) {
          setShippingOptions(data.shippingOptions)
          // Auto-select the cheapest one
          if (data.shippingOptions.length > 0) {
            setSelectedShipping(data.shippingOptions[0])
          }
        }
      } catch (err) {
        console.error("Failed to fetch shipping rates")
      } finally {
        setIsFetchingShipping(false)
      }
    }

    if (debouncedZip || formData.country) {
      fetchShipping()
    }
  }, [formData.country, debouncedZip, items])

  // ✅ NEW: Fetch Live Taxes
  useEffect(() => {
    const fetchTaxes = async () => {
      if (!formData.country) return
      setIsFetchingTax(true)
      try {
        const res = await fetch('/api/checkout/calculate-tax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subtotal, 
            shipping: selectedShipping?.price || 0, 
            country: formData.country, 
            state: formData.state 
          })
        })
        const data = await res.json()
        if (data.taxAmount !== undefined) setTaxAmount(data.taxAmount)
      } catch (err) {
        console.error("Failed to fetch taxes")
      } finally {
        setIsFetchingTax(false)
      }
    }

    fetchTaxes()
  }, [formData.country, formData.state, selectedShipping?.price, subtotal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setDiscountLoading(true)
    try {
      const res = await fetch('/api/checkout/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), subtotal }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Invalid code'); setDiscount(null) } 
      else { setDiscount(data); toast.success(data.message) }
    } catch { toast.error('Failed to apply discount') } 
    finally { setDiscountLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!formData.email || !formData.name || !formData.address || !formData.city || !formData.zip || !formData.phone || !formData.country) {
      setError('Please fill in all required fields'); setLoading(false); return
    }
    if (states.length > 0 && !formData.state) {
      setError('Please select a state/province'); setLoading(false); return
    }
    if (!selectedShipping) {
      setError('Please select a shipping method'); setLoading(false); return
    }

    try {
      const country = Country.getCountryByCode(formData.country)
      const state = formData.state ? State.getStateByCodeAndCountry(formData.state, formData.country) : null

      const endpoint = paymentMethod === 'stripe' ? '/api/checkout' : '/api/checkout/flutterwave'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          email: formData.email,
          shippingAddress: {
            name: formData.name, address1: formData.address, city: formData.city,
            state: state?.name || formData.state || '', zip: formData.zip,
            country: country?.name || formData.country, phone: formData.phone,
          },
          discountCode: discount?.code || null,
          discountAmount: discount?.discountAmount || 0,
          // ✅ Passing Dynamic Fees to Backend
          shippingCost: selectedShipping.price,
          shippingMethodId: selectedShipping.id,
          taxAmount: taxAmount
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url
      else throw new Error('No checkout URL received')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Cost Calculations
  const shippingCost = discount?.type === 'FREE_SHIPPING' ? 0 : (selectedShipping?.price || 0)
  const discountAmount = discount?.discountAmount || 0
  const finalTotal = subtotal + shippingCost + taxAmount - discountAmount

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <button onClick={() => router.push('/products')} className="btn-primary mt-4 px-8 py-3">Browse Products</button>
        </div>
      </div>
    )
  }

  const inputCls = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none transition-all text-sm bg-gray-50/50"
  const labelCls = "block text-sm font-bold text-gray-700 mb-1.5"

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Shipping Address */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <MapPin size={22} className="text-tiffany-600" /> Shipping Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} placeholder="+256 700 000 000" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Country <span className="text-red-500">*</span></label>
                    <select name="country" value={formData.country} onChange={(e) => {handleChange(e); setShippingOptions([]); setSelectedShipping(null)}} required className={inputCls}>
                      <option value="">Select a country</option>
                      {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Street Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputCls} placeholder="123 Main Street, Apt 4B" />
                  </div>
                  <div>
                    <label className={labelCls}>City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputCls} placeholder="Kampala" />
                  </div>
                  <div>
                    <label className={labelCls}>State / Province {states.length > 0 && <span className="text-red-500">*</span>}</label>
                    {states.length > 0 ? (
                      <select name="state" value={formData.state} onChange={handleChange} required className={inputCls}>
                        <option value="">Select state/province</option>
                        {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputCls} placeholder="State / Region" />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>ZIP / Postal Code <span className="text-red-500">*</span></label>
                    <input type="text" name="zip" value={formData.zip} onChange={handleChange} required className={inputCls} placeholder="00000" />
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Dynamic Shipping Options */}
              <ShippingOptions 
                options={shippingOptions} 
                selectedId={selectedShipping?.id || ''} 
                onSelect={setSelectedShipping} 
                isLoading={isFetchingShipping} 
              />

              {/* Payment Method Selection */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <CreditCard size={22} className="text-tiffany-600" /> Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${paymentMethod === 'flutterwave' ? 'border-tiffany-500 bg-tiffany-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'flutterwave'} onChange={() => setPaymentMethod('flutterwave')} className="w-5 h-5 text-tiffany-600 focus:ring-tiffany-500" />
                      <div>
                        <p className="font-bold text-gray-900">Mobile Money & Cards</p>
                        <p className="text-xs text-gray-500 mt-1">MTN, Airtel, Local Cards</p>
                      </div>
                    </div>
                  </label>
                  <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${paymentMethod === 'stripe' ? 'border-tiffany-500 bg-tiffany-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} className="w-5 h-5 text-tiffany-600 focus:ring-tiffany-500" />
                      <div>
                        <p className="font-bold text-gray-900">Credit Card (Stripe)</p>
                        <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedShipping || isFetchingShipping || isFetchingTax}
                className="w-full bg-gray-900 hover:bg-black text-white py-4 sm:py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 text-lg"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <CreditCard size={24} />}
                {loading ? 'Processing…' : `Pay $${finalTotal.toFixed(2)} Securely`}
              </button>
            </form>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
                      <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{item.title}</p>
                      <p className="text-sm text-gray-500 font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="mb-6 pt-6 border-t border-gray-100">
                {discount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <div>
                        <p className="font-bold text-green-800 text-sm uppercase tracking-wider">{discount.code}</p>
                        <p className="text-xs text-green-600 font-medium">{discount.message}</p>
                      </div>
                    </div>
                    <button onClick={() => { setDiscount(null); setDiscountCode('') }} className="text-xs text-red-500 hover:text-red-700 font-bold">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-tiffany-500 outline-none uppercase bg-gray-50"
                    />
                    <button
                      type="button" onClick={handleApplyDiscount} disabled={!discountCode.trim() || discountLoading}
                      className="px-5 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                    >
                      {discountLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <PaymentSummary 
                subtotal={subtotal}
                shipping={shippingCost}
                tax={taxAmount}
                discountAmount={discountAmount}
                discountCode={discount?.code}
                total={finalTotal}
                isCalculating={isFetchingShipping || isFetchingTax}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
