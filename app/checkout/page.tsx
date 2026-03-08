// app/checkout/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCart } from '@/lib/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Truck, CreditCard, AlertCircle, MapPin } from 'lucide-react'
import { Country, State, City } from 'country-state-city'
import type { ICountry, IState } from 'country-state-city'

export default function CheckoutPage() {
  const { items, total } = useCart()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US', // Store country code instead of name
    phone: '',
  })

  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null)
  const [states, setStates] = useState<IState[]>([])

  // Get all countries sorted alphabetically
  const countries = useMemo(() => {
    return Country.getAllCountries().sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }, [])

  // Update states when country changes
  useEffect(() => {
    if (formData.country) {
      const country = Country.getCountryByCode(formData.country)
      setSelectedCountry(country || null)
      
      if (country) {
        const countryStates = State.getStatesOfCountry(country.isoCode)
        setStates(countryStates)
        
        // Reset state if it doesn't exist in new country
        if (formData.state && !countryStates.find(s => s.isoCode === formData.state)) {
          setFormData(prev => ({ ...prev, state: '' }))
        }
      }
    }
  }, [formData.country])

  // Set default country on mount
  useEffect(() => {
    const defaultCountry = Country.getCountryByCode('US')
    if (defaultCountry) {
      setSelectedCountry(defaultCountry)
      setStates(State.getStatesOfCountry('US'))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      state: '', // Reset state when country changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!formData.email || !formData.name || !formData.address || !formData.city || 
        !formData.zip || !formData.phone || !formData.country) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Validate state for countries that have states
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

    try {
      // Get country and state names
      const country = Country.getCountryByCode(formData.country)
      const state = formData.state ? State.getStateByCodeAndCountry(formData.state, formData.country) : null

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: 1,
          })),
          email: formData.email,
          shippingAddress: {
            name: formData.name,
            address1: formData.address,
            city: formData.city,
            state: state?.name || formData.state || '', // Use state name if available
            zip: formData.zip,
            postalCode: formData.zip,
            country: country?.name || formData.country, // Use country name
            countryCode: formData.country, // Also send code
            phone: formData.phone,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Get field labels based on country
  const getFieldLabels = () => {
    const countryCode = formData.country
    
    return {
      state: countryCode === 'US' ? 'State' : 
             countryCode === 'CA' ? 'Province' : 
             countryCode === 'GB' ? 'County' : 
             'State / Province / Region',
      zip: countryCode === 'US' ? 'ZIP Code' :
           countryCode === 'GB' ? 'Postcode' :
           countryCode === 'CA' ? 'Postal Code' :
           'ZIP / Postal Code',
    }
  }

  const labels = getFieldLabels()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products before checking out</p>
          <button
            onClick={() => router.push('/products')}
            className="btn-primary px-8 py-3"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  const subtotal = total
  const shipping = subtotal >= 50 ? 0 : 9.99
  const tax = subtotal * 0.1
  const finalTotal = subtotal + shipping + tax

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck size={24} className="text-tiffany-600" />
                  Shipping Information
                </h2>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include country code for international shipping
                  </p>
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={20} className="text-tiffany-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleCountryChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.isoCode} value={country.isoCode}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {labels.state} {states.length > 0 && <span className="text-red-500">*</span>}
                      </label>
                      {states.length > 0 ? (
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required={states.length > 0}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                        >
                          <option value="">Select {labels.state.toLowerCase()}</option>
                          {states.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                          placeholder={labels.state}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {labels.zip} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
                      placeholder={
                        formData.country === 'US' ? '10001' :
                        formData.country === 'GB' ? 'SW1A 1AA' :
                        formData.country === 'CA' ? 'K1A 0B1' :
                        '12345'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Selected Address Preview */}
              {selectedCountry && (
                <div className="bg-tiffany-50 border border-tiffany-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📍 Shipping to:</p>
                  <p className="text-sm text-gray-600">
                    {selectedCountry.flag} {selectedCountry.name}
                    {formData.state && states.find(s => s.isoCode === formData.state) && 
                      `, ${states.find(s => s.isoCode === formData.state)?.name}`}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={24} />
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-tiffany-600">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < 50 && (
                <div className="mt-4 bg-tiffany-50 border border-tiffany-200 rounded-lg p-3">
                  <p className="text-sm text-tiffany-800">
                    💡 Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
