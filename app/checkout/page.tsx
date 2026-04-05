// app/checkout/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCart } from '@/lib/contexts/CartContext'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Truck, CreditCard, AlertCircle, MapPin, CheckCircle, 
  ChevronRight, Loader2, ChevronLeft 
} from 'lucide-react'
import { Country, State } from 'country-state-city'
import type { ICountry, IState } from 'country-state-city'
import toast from 'react-hot-toast'
import { getSecureImageUrl } from '@/lib/imageUrl'

// ==========================================
// 1. LOCAL COMPONENTS (Prevents Import Crashes)
// ==========================================

interface ShippingOption {
  id: string; displayName: string; tier: string; icon: string; 
  price: number; estimatedDays: string; description: string;
}

function ShippingOptionsList({ options, selectedId, onSelect, isLoading }: { options: ShippingOption[], selectedId: string, onSelect: (o: ShippingOption) => void, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl border-2 border-gray-100" />)}
      </div>
    )
  }
  if (options.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 animate-in fade-in">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Truck size={20} className="text-tiffany-600" /> Shipping Method
      </h2>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id
          return (
            <label key={option.id} className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-tiffany-500 bg-tiffany-50 shadow-sm' : 'border-gray-200 hover:border-tiffany-300 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <input type="radio" name="shipping_method" value={option.id} checked={isSelected} onChange={() => onSelect(option)} className="w-4 h-4 text-tiffany-600 border-gray-300 focus:ring-tiffany-500 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{option.icon}</span>
                    <p className="font-bold text-gray-900 text-sm">{option.displayName}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 text-sm">{option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}</p>
                {isSelected && <CheckCircle size={16} className="text-tiffany-600 absolute -top-2 -right-2 bg-white rounded-full" />}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function PaymentSummaryBox({ subtotal, shipping, tax, discountAmount, discountCode, total, isCalculating }: any) {
  const ValueDisplay = ({ value, isFree = false, isNegative = false }: any) => {
    if (isCalculating) return <Loader2 size={14} className="animate-spin text-gray-400" />
    if (isFree && value === 0) return <span className="text-green-600 font-bold">FREE</span>
    return <span className={isNegative ? "text-green-600 font-bold" : "text-gray-900 font-medium"}>{isNegative ? '-' : ''}${value.toFixed(2)}</span>
  }

  return (
    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Subtotal</span><ValueDisplay value={subtotal} />
      </div>
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Shipping</span><ValueDisplay value={shipping} isFree={true} />
      </div>
      <div className="flex justify-between text-gray-600 items-center h-6">
        <span>Estimated Tax</span><ValueDisplay value={tax} />
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-green-600 font-medium items-center h-6">
          <span>Discount ({discountCode})</span><ValueDisplay value={discountAmount} isNegative={true} />
        </div>
      )}
      <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between font-black text-gray-900 text-base sm:text-lg items-center h-8">
        <span>Total</span>
        {isCalculating ? <Loader2 size={18} className="animate-spin text-tiffany-600" /> : <span className="text-tiffany-600">${total.toFixed(2)}</span>}
      </div>
    </div>
  )
}

// ==========================================
// 2. MAIN CHECKOUT PAGE
// ==========================================

export default function CheckoutPage() {
  const { items, total: subtotal } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '', name: '', address: '', city: '', state: '', zip: '', country: 'UG', phone: '',
  })
  
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null)
  const [states, setStates] = useState<IState[]>([])

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isFetchingShipping, setIsFetchingShipping] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'flutterwave'>('flutterwave')

  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discount, setDiscount] = useState<any>(null)

  const countries = useMemo(() => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)), [])

  // Mount check prevents hydration errors
  useEffect(() => { setMounted(true) }, [])

  // Init Data
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: prev.email || session.user!.email!, name: prev.name || session.user!.name || '' }))
    }
    const def = Country.getCountryByCode('UG') || Country.getCountryByCode('US')
    if (def) { setSelectedCountry(def); setStates(State.getStatesOfCountry(def.isoCode)) }
  }, [session])

  // Update States on Country Change
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

  // ── MOVE TO STEP 2: FETCH SHIPPING ──
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.name || !formData.address || !formData.city || !formData.zip || !formData.phone || !formData.country) {
      setError('Please fill in all required fields.')
      return
    }
    if (states.length > 0 && !formData.state) {
      setError('Please select a state/province.')
      return
    }

    setStep(2) 
    setIsFetchingShipping(true)
    
    try {
      console.log('[CHECKOUT] Fetching shipping rates for:', { country: formData.country, zip: formData.zip })
      
      const shipRes = await fetch('/api/checkout/shipping-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, country: formData.country, zip: formData.zip })
      })
      
      const shipData = await shipRes.json()
      
      if (!shipRes.ok) throw new Error(shipData.error || 'Failed to fetch shipping rates.')

      if (shipData.shippingOptions?.length > 0) {
        setShippingOptions(shipData.shippingOptions)
        setSelectedShipping(shipData.shippingOptions[0]) 
      } else {
        throw new Error('No shipping options available for this destination.')
      }

      console.log('[CHECKOUT] Fetching taxes...')
      const taxRes = await fetch('/api/checkout/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subtotal, shipping: shipData.shippingOptions[0]?.price || 0, country: formData.country, state: formData.state 
        })
      })
      
      const taxData = await taxRes.json()
      if (taxData.taxAmount !== undefined) setTaxAmount(taxData.taxAmount)

    } catch (err: any) {
      console.error('[CHECKOUT ERROR]', err)
      setError(err.message)
      toast.error(err.message)
      setStep(1) // Kick back to step 1
    } finally {
      setIsFetchingShipping(false)
    }
  }

  // ── MOVE TO STEP 3: PAYMENT ──
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipping) return setError('Please select a shipping method.')
    setError(null)
    setStep(3)
  }

  // ── SUBMIT ORDER ──
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const country = Country.getCountryByCode(formData.country)
      const state = formData.state ? State.getStateByCodeAndCountry(formData.state, formData.country) : null

      const endpoint = paymentMethod === 'stripe' ? '/api/checkout' : '/api/checkout/flutterwave'

      const payload = {
        items,
        email: formData.email,
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

      console.log(`[CHECKOUT] Sending to ${endpoint}:`, payload)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Payment gateway rejected the request.')

      window.location.href = data.url

    } catch (err: any) {
      console.error('[CHECKOUT ERROR]', err)
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
    } catch { toast.error('Failed to apply discount') } 
    finally { setDiscountLoading(false) }
  }

  // Cost Calculations
  const shippingCost = discount?.type === 'FREE_SHIPPING' ? 0 : (selectedShipping?.price || 0)
  const discountAmount = discount?.discountAmount || 0
  const finalTotal = subtotal + (step > 1 ? shippingCost : 0) + (step > 1 ? taxAmount : 0) - discountAmount

  // Early returns
  if (!mounted) return null
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
  const stateLabel = formData.country === 'US' ? 'State' : formData.country === 'CA' ? 'Province' : formData.country === 'GB' ? 'County' : 'State / Region'
  const zipLabel = formData.country === 'US' ? 'ZIP Code' : formData.country === 'GB' ? 'Postcode' : formData.country === 'CA' ? 'Postal Code' : 'ZIP / Postal Code'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} placeholder="+1 555 000 0000" />
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
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputCls} placeholder="City" />
                  </div>
                  <div>
                    <label className={labelCls}>{stateLabel} {states.length > 0 && <span className="text-red-500">*</span>}</label>
                    {states.length > 0 ? (
                      <select name="state" value={formData.state} onChange={handleChange} required className={inputCls}>
                        <option value="">Select {stateLabel.toLowerCase()}</option>
                        {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputCls} placeholder={stateLabel} />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{zipLabel} <span className="text-red-500">*</span></label>
                    <input type="text" name="zip" value={formData.zip} onChange={handleChange} required className={inputCls} placeholder="ZIP/Postal Code" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
                    Continue to Shipping <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={handleShippingSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5 animate-in slide-in-from-right-4">
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

                <ShippingOptionsList options={shippingOptions} selectedId={selectedShipping?.id || ''} onSelect={setSelectedShipping} isLoading={isFetchingShipping} />

                <div className="pt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setStep(1)} className="text-tiffany-600 font-bold hover:text-tiffany-700 flex items-center gap-1 text-sm">
                    <ChevronLeft size={16} /> Return to info
                  </button>
                  <button type="submit" disabled={isFetchingShipping || !selectedShipping} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
                    Continue to Payment <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handlePaymentSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5 animate-in slide-in-from-right-4">
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
                        <p className="font-bold text-gray-900">Credit Card</p>
                        <p className="text-xs text-gray-500 mt-1">Stripe Secure</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button type="button" onClick={() => setStep(2)} className="text-tiffany-600 font-bold hover:text-tiffany-700 flex items-center gap-1 text-sm">
                    <ChevronLeft size={16} /> Return to shipping
                  </button>
                  <button type="submit" disabled={loading} className="bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 text-base sm:text-lg">
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <CreditCard size={24} />}
                    {loading ? 'Processing…' : `Pay $${finalTotal.toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image src={getSecureImageUrl(item.image)} alt={item.title} fill className="object-cover" sizes="64px" />
                      <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2">{item.title}</p>
                      <p className="text-sm text-gray-500 font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6 pt-6 border-t border-gray-100">
                {discount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <div>
                        <p className="font-bold text-green-800 text-sm uppercase">{discount.code}</p>
                        <p className="text-xs text-green-600 font-medium">{discount.message}</p>
                      </div>
                    </div>
                    <button onClick={() => { setDiscount(null); setDiscountCode('') }} className="text-xs text-red-500 font-bold">Remove</button>
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

              <PaymentSummary 
                subtotal={subtotal}
                shipping={step > 1 ? shippingCost : 0} 
                tax={step > 1 ? taxAmount : 0} 
                discountAmount={discountAmount}
                discountCode={discount?.code}
                total={step > 1 ? finalTotal : subtotal - discountAmount} 
                isCalculating={isFetchingShipping || isFetchingTax}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
