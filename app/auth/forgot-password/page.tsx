// app/auth/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/logo.svg" alt="TealMart" className="h-14 w-auto object-contain mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h2>
          <p className="text-gray-600">Enter your email and we'll send a reset link</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className="text-xs text-gray-500 mb-6">The link expires in 1 hour.</p>
              <Link
                href="/auth/signin"
                className="block w-full py-3 text-center bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-semibold rounded-xl hover:from-tiffany-600 hover:to-tiffany-700 transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 transition-all text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-tiffany-600 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
                  }
