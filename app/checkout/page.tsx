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

interface SavedAddress {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  isDefault: boolean
}

interface DiscountResult {
  valid: boolean
  code: string
  type: string
  value: number
  discountAmount: number
  message: string
}

export default function CheckoutPage() {
  const { items, total } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const[formData, setFormData] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  })

  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null)
  const [states, setStates] = useState<IState[]>([])

  const[savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)

  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discount, setDiscount] = useState<DiscountResult | null>(null)

  const countries = useMemo(
    () => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)),[]
  )

  // Pre-fill email from session
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: prev.email || session.user!.email! }))
    }
  }, [session])

  // Load saved addresses
  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/addresses')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data)
          const def = data.find((a: SavedAddress) => a.isDefault) || data[0]
          if (def) applyAddress(def)
        }
      })
      .catch(() => {})
  },[session?.user?.id])

  // Update states when country changes
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

  // Init default country
  useEffect(() => {
    const def = Country.getCountryByCode('US')
    if (def) {
      setSelectedCountry(def)
      setStates(State.getStatesOfCountry('US'))
    }
  },[])

  function applyAddress(addr: SavedAddress) {
    setFormData(prev => ({
      ...prev,
      name: addr.name,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone || prev.phone,
    }))
    setShowSavedAddresses(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev,[e.target.name]: e.target.value }))
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, country: e.target.value, state: '' }))
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setDiscountLoading(true)
    try {
      const res = await fetch('/api/checkout/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), subtotal: total }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invalid code')
        setDiscount(null)
      } else {
        setDiscount(data)
        toast.success(data.message)
      }
    } catch {
      toast.error('Failed to apply discount')
    } finally {
      setDiscountLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (
      !formData.email || !formData.name || !formData.address ||
      !formData.city || !formData.zip || !formData.phone || !formData.country
    ) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (states.length > 0 && !formData.state) {
      setError('Please select a state/province')
      setLoading(false)
      return
    }

    if (items.length === 0) {
      setError('Your cart is empty')
      setLoading(false)
      return
    }

    if (saveAddress && session?.user?.id) {
      fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isDefault: savedAddresses.length === 0 }),
      }).catch(() => {})
    }

    try {
      const country = Country.getCountryByCode(formData.country)
      const state = formData.state
        ? State.getStateByCodeAndCountry(formData.state, formData.country)
        : null

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          email: formData.email,
          shippingAddress: {
            name: formData.name,
            address1: formData.address,
            city: formData.city,
            state: state?.name || formData.state || '',
            zip: formData.zip,
            postalCode: formData.zip,
            country: country?.name || formData.country,
            countryCode: formData.country,
            phone: formData.phone,
          },
          discountCode: discount?.code || null,
          discountAmount: discount?.discountAmount || 0,
          freeShipping: discount?.type === 'FREE_SHIPPING',
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Checkout failed')

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const getFieldLabels = () => ({
    state:
      formData.country === 'US' ? 'State' :
      formData.country === 'CA' ? 'Province' :
      formData.country === 'GB' ? 'County' :
      'State / Region',
    zip:
      formData.country === 'US' ? 'ZIP Code' :
      formData.country === 'GB' ? 'Postcode' :
      formData.country === 'CA' ? 'Postal Code' :
      'ZIP / Postal Code',
  })

  const labels = getFieldLabels()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products before checking out</p>
          <button onClick={() => router.push('/products')} className="btn-primary px-8 py-3">
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  const subtotal = total
  const freeShipping = discount?.type === 'FREE_SHIPPING'
  const shipping = freeShipping || subtotal >= 50 ? 0 : 9.99
  const tax = 0; // Flat tax removed for proper Stripe calculation
  const discountAmount = discount?.discountAmount || 0
  const finalTotal = subtotal + shipping + tax - discountAmount

  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none transition-all text-sm'
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Form ── */}
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                  <button
                    type="button"
                    onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                    className="flex items-center justify-between w-full"
                  >
                    <span className="font-bold text-gray-900 flex items-center gap-2">
                      <MapPin size={18} className="text-tiffany-600" />
                      Saved Addresses ({savedAddresses.length})
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${showSavedAddresses ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showSavedAddresses && (
                    <div className="mt-4 space-y-3">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => applyAddress(addr)}
                          className="w-full text-left p-3 border border-gray-200 rounded-xl hover:border-tiffany-400 hover:bg-tiffany-50 transition-all text-sm"
                        >
                          <div className="font-semibold text-gray-900">
                            {addr.name}
                            {addr.isDefault && (
                              <span className="text-xs bg-tiffany-100 text-tiffany-700 px-1.5 py-0.5 rounded ml-2">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500">
                            {addr.address}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck size={20} className="text-tiffany-600" />
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder="+1 555 123 4567"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleCountryChange}
                      required
                      className={inputCls}
                    >
                      <option value="">Select a country</option>
                      {countries.map(c => (
                        <option key={c.isoCode} value={c.isoCode}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>
                      {labels.state}
                      {states.length > 0 && <span className="text-red-500"> *</span>}
                    </label>
                    {states.length > 0 ? (
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className={inputCls}
                      >
                        <option value="">Select {labels.state.toLowerCase()}</option>
                        {states.map(s => (
                          <option key={s.isoCode} value={s.isoCode}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={labels.state}
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>
                      {labels.zip} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      placeholder={
                        formData.country === 'US' ? '10001' :
                        formData.country === 'GB' ? 'SW1A 1AA' :
                        '12345'
                      }
                    />
                  </div>
                </div>

                {session?.user?.id && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={e => setSaveAddress(e.target.checked)}
                      className="rounded text-tiffany-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Save this address for future orders</span>
                  </label>
                )}
              </div>

              {/* Discount code */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Tag size={18} className="text-tiffany-600" />
                  Discount Code
                </h3>

                {discount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800 text-sm">{discount.code}</p>
                        <p className="text-xs text-green-600">{discount.message}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDiscount(null); setDiscountCode('') }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyDiscount()
                        }
                      }}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim() || discountLoading}
                      className="px-4 py-2.5 bg-tiffany-500 hover:bg-tiffany-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5"
                    >
                      {discountLoading && <Loader2 size={14} className="animate-spin" />}
                      Apply
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? <Loader2 size={22} className="animate-spin" /> : <CreditCard size={22} />}
                {loading ? 'Processing…' : `Pay ${finalTotal > 0 ? `$${finalTotal.toFixed(2)}` : ''} Securely`}
              </button>

              <p className="text-xs text-center text-gray-400">
                🔒 Secured by Stripe. We never store your card details.
              </p>
            </form>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      {item.quantity > 1 && (
                        <div className="absolute -top-1 -right-1 bg-tiffany-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                      <p className="text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({discount?.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-tiffany-600">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < 50 && !freeShipping && (
                <div className="mt-4 bg-tiffany-50 border border-tiffany-200 rounded-xl p-3">
                  <p className="text-xs text-tiffany-800 font-medium">
                    💡 Add <strong>${(50 - subtotal).toFixed(2)}</strong> more for free shipping!
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
