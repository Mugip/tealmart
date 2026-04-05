// app/checkout/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCart } from '@/lib/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  CreditCard, AlertCircle, MapPin, CheckCircle, 
  ChevronRight, Loader2, ChevronLeft, Bug
} from 'lucide-react'
import { Country, State } from 'country-state-city'
import type { ICountry, IState } from 'country-state-city'
import toast from 'react-hot-toast'
import { getSecureImageUrl } from '@/lib/imageUrl'

import ShippingOptions, { ShippingOption } from '@/components/checkout/ShippingOptions'
import PaymentSummary from '@/components/checkout/PaymentSummary'

export default function CheckoutPage() {
  const { items, total: subtotal } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  // --- STATE ---
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '', name: '', address: '', city: '', state: '', zip: '', country: 'US', phone: '',
  })
  
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null)
  const [states, setStates] = useState<IState[]>([])

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isFetchingShipping, setIsFetchingShipping] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'flutterwave'>('stripe')

  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discount, setDiscount] = useState<any>(null)

  const [showDebug, setShowDebug] = useState(false) // On-screen debug toggle

  const countries = useMemo(() => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)), [])

  // --- HYDRATION SAFEGUARD ---
  useEffect(() => { 
    setMounted(true) 
  }, [])

  // --- PREFILL DATA ---
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ 
        ...prev, 
        email: prev.email || session.user!.email!, 
        name: prev.name || session.user!.name || '' 
      }))
    }
    const def = Country.getCountryByCode('US')
    if (def) { 
      setSelectedCountry(def); 
      setStates(State.getStatesOfCountry(def.isoCode)) 
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  // --- STEP 1: SUBMIT INFO & FETCH RATES ---
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.name || !formData.address || !formData.city || !formData.zip || !formData.phone || !formData.country) {
      return setError('Please fill in all required fields.')
    }
    if (states.length > 0 && !formData.state) {
      return setError('Please select a state/province.')
    }

    setIsFetchingShipping(true)
    setError(null)

    try {
      // 1. Fetch Shipping Options based on Address
      const shipRes = await fetch('/api/checkout/shipping-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, country: formData.country, zip: formData.zip })
      })
      const shipData = await shipRes.json()
      
      if (shipData.shippingOptions?.length > 0) {
        setShippingOptions(shipData.shippingOptions)
        setSelectedShipping(shipData.shippingOptions[0]) 
      } else {
        throw new Error('No shipping options available for this destination.')
      }

      // 2. Fetch Taxes based on Address
      const taxRes = await fetch('/api/checkout/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal, shipping: shipData.shippingOptions[0]?.price || 0, country: formData.country, state: formData.state })
      })
      const taxData = await taxRes.json()
      if (taxData.taxAmount !== undefined) setTaxAmount(taxData.taxAmount)

      // Move to Step 2 only after fetching succeeds
      setStep(2)

    } catch (err: any) {
      setError(err.message || 'Failed to calculate shipping rates.')
      toast.error(err.message || 'Shipping calculation failed.')
    } finally {
      setIsFetchingShipping(false)
    }
  }

  // --- STEP 2: SUBMIT SHIPPING ---
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipping) return setError('Please select a shipping method.')
    setStep(3)
  }

  // --- STEP 3: SUBMIT PAYMENT ---
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const country = Country.getCountryByCode(formData.country)
      const state = formData.state ? State.getStateByCodeAndCountry(formData.state, formData.country) : null
      const endpoint = paymentMethod === 'stripe' ? '/api/checkout' : '/api/checkout/flutterwave'

      const payload = {
        items, email: formData.email,
        shippingAddress: {
          name: formData.name, address1: formData.address, city: formData.city,
          state: state?.name || formData.state || '', zip: formData.zip,
          country: country?.name || formData.country, phone: formData.phone,
        },
        discountCode: discount?.code || null,
        discountAmount: discount?.discountAmount || 0,
        shippingCost: selectedShipping!.price,
        shippingMethodId: selectedShipping!.id,
        taxAmount: taxAmount
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Payment gateway rejected the request.')
      window.location.href = data.url

    } catch (err: any) {
      setError(err.message || 'Payment initiation failed.')
      toast.error(err.message || 'Payment initiation failed.')
      setLoading(false)
    }
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
    } catch (err: any) { 
      toast.error('Failed to apply discount') 
    } finally { setDiscountLoading(false) }
  }

  // Cost Calculations
  const shippingCost = discount?.type === 'FREE_SHIPPING' ? 0 : (selectedShipping?.price || 0)
  const discountAmount = discount?.discountAmount || 0
  const finalTotal = subtotal + (step > 1 ? shippingCost : 0) + (step > 1 ? taxAmount : 0) - discountAmount

  // --- HYDRATION / EMPTY CART CHECK ---
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-tiffany-600 mb-4" />
        <p className="text-gray-500 font-medium">Preparing secure checkout...</p>
      </div>
    )
  }

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

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tiffany-500 outline-none transition-all text-sm bg-gray-50/50"
  const labelCls = "block text-sm font-bold text-gray-700 mb-1.5"
  const stateLabel = formData.country === 'US' ? 'State' : formData.country === 'CA' ? 'Province' : formData.country === 'GB' ? 'County' : 'State / Region'
  const zipLabel = formData.country === 'US' ? 'ZIP Code' : formData.country === 'GB' ? 'Postcode' : formData.country === 'CA' ? 'Postal Code' : 'ZIP / Postal Code'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto relative">
        
        {/* ON-SCREEN DEBUGGER */}
        <button onClick={() => setShowDebug(!showDebug)} className="absolute top-0 right-0 p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 z-50">
          <Bug size={16} />
        </button>
        {showDebug && (
          <div className="mb-6 p-4 bg-black text-green-400 font-mono text-xs rounded-xl overflow-auto max-h-64 shadow-2xl">
            <p className="text-white mb-2 font-bold uppercase border-b border-gray-700 pb-2">Checkout State Debugger</p>
            <p>Step: {step}</p>
            <p>Subtotal: ${subtotal}</p>
            <p>Country Selected: {formData.country}</p>
            <p>Shipping Options Loaded: {shippingOptions.length}</p>
            <p>Selected Shipping ID: {selectedShipping?.id || 'None'}</p>
            <p>Fetching Rates?: {isFetchingShipping ? 'Yes' : 'No'}</p>
            <p>Tax Calculated: ${taxAmount}</p>
            <p>Final Total: ${finalTotal}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm mb-8 font-medium">
          <button onClick={() => setStep(1)} className={`${step >= 1 ? 'text-tiffany-600 font-bold' : 'text-gray-400'}`}>Information</button>
          <ChevronRight size={14} className="text-gray-300" />
          <button disabled={step < 2} onClick={() => setStep(2)} className={`disabled:cursor-not-allowed ${step >= 2 ? 'text-tiffany-600 font-bold' : 'text-gray-400'}`}>Shipping</button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className={`${step === 3 ? 'text-tiffany-600 font-bold' : 'text-gray-400'}`}>Payment</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-col-reverse">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handleInfoSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <MapPin size={22} className="text-tiffany-600" /> Contact & Shipping
                </h2>
                <p className="text-sm text-gray-500 mb-4">Enter your details. Shipping options and taxes will be calculated in the next step.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Country <span className="text-red-500">*</span></label>
                    <select name="country" value={formData.country} onChange={handleChange} required className={inputCls}>
                      <option value="">Select a country</option>
                      {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Street Address <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{stateLabel} {states.length > 0 && <span className="text-red-500">*</span>}</label>
                    {states.length > 0 ? (
                      <select name="state" value={formData.state} onChange={handleChange} required className={inputCls}>
                        <option value="">Select {stateLabel.toLowerCase()}</option>
                        {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputCls} />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{zipLabel} <span className="text-red-500">*</span></label>
                    <input type="text" name="zip" value={formData.zip} onChange={handleChange} required className={inputCls} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isFetchingShipping} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                    {isFetchingShipping ? <Loader2 className="animate-spin" size={18} /> : null}
                    {isFetchingShipping ? 'Calculating Rates...' : 'Continue to Shipping'} <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={handleShippingSubmit} className="space-y-6 animate-in slide-in-from-right-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 mb-6 text-sm">
                    <div className="flex justify-between p-4">
                      <span className="text-gray-500 w-24">Contact</span>
                      <span className="flex-1 font-medium">{formData.email}</span>
                      <button type="button" onClick={() => setStep(1)} className="text-tiffany-600 font-bold hover:underline">Change</button>
                    </div>
                    <div className="flex justify-between p-4">
                      <span className="text-gray-500 w-24">Ship to</span>
                      <span className="flex-1 font-medium">{formData.address}, {formData.city}, {formData.zip}, {formData.country}</span>
                      <button type="button" onClick={() => setStep(1)} className="text-tiffany-600 font-bold hover:underline">Change</button>
                    </div>
                  </div>

                  <ShippingOptions options={shippingOptions} selectedId={selectedShipping?.id || ''} onSelect={setSelectedShipping} isLoading={isFetchingShipping} />

                  <div className="pt-6 flex items-center justify-between">
                    <button type="button" onClick={() => setStep(1)} className="text-tiffany-600 font-bold hover:text-tiffany-700 flex items-center gap-1 text-sm">
                      <ChevronLeft size={16} /> Return to information
                    </button>
                    <button type="submit" disabled={!selectedShipping} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                      Continue to Payment <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6 animate-in slide-in-from-right-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 mb-6 text-sm">
                    <div className="flex justify-between p-4">
                      <span className="text-gray-500 w-24">Contact</span>
                      <span className="flex-1 font-medium">{formData.email}</span>
                      <button type="button" onClick={() => setStep(1)} className="text-tiffany-600 font-bold hover:underline">Change</button>
                    </div>
                    <div className="flex justify-between p-4">
                      <span className="text-gray-500 w-24">Ship to</span>
                      <span className="flex-1 font-medium">{formData.address}, {formData.city}, {formData.zip}</span>
                      <button type="button" onClick={() => setStep(1)} className="text-tiffany-600 font-bold hover:underline">Change</button>
                    </div>
                    <div className="flex justify-between p-4">
                      <span className="text-gray-500 w-24">Method</span>
                      <span className="flex-1 font-medium">{selectedShipping?.displayName} · ${selectedShipping?.price.toFixed(2)}</span>
                      <button type="button" onClick={() => setStep(2)} className="text-tiffany-600 font-bold hover:underline">Change</button>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <CreditCard size={22} className="text-tiffany-600" /> Payment Method
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">All transactions are secure and encrypted.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${paymentMethod === 'flutterwave' ? 'border-tiffany-500 bg-tiffany-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" checked={paymentMethod === 'flutterwave'} onChange={() => setPaymentMethod('flutterwave')} className="w-5 h-5 text-tiffany-600" />
                        <div>
                          <p className="font-bold text-gray-900">Mobile Money & Cards</p>
                          <p className="text-xs text-gray-500 mt-1">MTN, Airtel, Local Cards</p>
                        </div>
                      </div>
                    </label>
                    <label className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${paymentMethod === 'stripe' ? 'border-tiffany-500 bg-tiffany-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} className="w-5 h-5 text-tiffany-600" />
                        <div>
                          <p className="font-bold text-gray-900">Credit Card (Stripe)</p>
                          <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-6 flex items-center justify-between">
                    <button type="button" onClick={() => setStep(2)} className="text-tiffany-600 font-bold hover:text-tiffany-700 flex items-center gap-1 text-sm">
                      <ChevronLeft size={16} /> Return to shipping
                    </button>
                    <button type="submit" disabled={loading} className="bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 text-base sm:text-lg">
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <CreditCard size={24} />}
                      {loading ? 'Processing…' : `Pay $${finalTotal.toFixed(2)}`}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image src={getSecureImageUrl(item.image)} alt={item.title} fill className="object-cover" sizes="64px" />
                      <div className="absolute -top-1 -right-1 bg-gray-500/90 backdrop-blur text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
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
                    <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} placeholder="Promo code" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 outline-none uppercase bg-gray-50" />
                    <button type="button" onClick={handleApplyDiscount} disabled={!discountCode.trim() || discountLoading} className="px-5 py-3 bg-gray-900 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                      {discountLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step passed down to control how summary displays text */}
              <PaymentSummary 
                step={step}
                subtotal={subtotal}
                shipping={shippingCost} 
                tax={taxAmount} 
                discountAmount={discountAmount}
                discountCode={discount?.code}
                total={finalTotal} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
