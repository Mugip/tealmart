// app/auth/reset-password/page.tsx
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react'                         
function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')                                                  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)         const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Password strength
  const strength = password.length === 0
    ? 0                                                   : password.length >= 12 && /[A-Z]/.test(password) && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password)
    ? 4
    : password.length >= 10 && /[A-Z]/.test(password) && /\d/.test(password)                                    ? 3
    : password.length >= 8                                ? 2
    : 1                                               
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-tiffany-400', 'bg-green-500']
                                                        if (!token || !email) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />                                             <h3 className="text-lg font-bold text-gray-900 mb-2">Invalid Reset Link</h3>
        <p className="text-gray-600 mb-4 text-sm">This link is missing required information.</p>
        <Link href="/auth/forgot-password" className="text-tiffany-600 hover:underline text-sm">                      Request a new reset link →
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')                                      
    if (password !== confirmPassword) {                     setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)                                      try {
      const res = await fetch('/api/auth/reset-password', {                                                         method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      })
                                                            const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/signin'), 3000)
    } catch {                                               setError('Something went wrong. Please try again.')                                                       } finally {
      setLoading(false)
    }
  }

  if (success) {                                          return (
      <div className="text-center py-4">                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h3>                                 <p className="text-gray-600 text-sm mb-4">Redirecting you to sign in...</p>
        <Link
          href="/auth/signin"
          className="text-tiffany-600 hover:text-tiffany-700 font-semibold text-sm"
        >
          Sign in now →                                       </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">                   {error}
        </div>                                              )}
                                                            <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>                        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>                                                <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required                                              minLength={8}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 transition-all text-sm"
            placeholder="Min. 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Strength bar */}                                  {password.length > 0 && (                               <div className="mt-2">                                  <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map(i => (                                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${                                                         i <= strength ? strengthColor[strength] : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>                                                <p className={`text-xs font-medium ${                   strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-tiffany-600' : 'text-green-600'                                     }`}>
              {strengthLabel[strength]}                           </p>                                                </div>
        )}                                                  </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <div className="relative">                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 transition-all text-sm ${
              confirmPassword && confirmPassword !== password
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Repeat your password"
          />
        </div>
        {confirmPassword && confirmPassword !== password && (                                                         <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
        )}
      </div>

      <button                                                 type="submit"
        disabled={loading || (!!confirmPassword && confirmPassword !== password)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"                                                     >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Updating...
          </>
        ) : (
          'Set New Password'
        )}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {           return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-50 flex items-center justify-center px-4 py-12">                                <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-tiffany-600 to-tiffany-400 bg-clip-text text-transparent">
              TealMart
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Set new password</h2>
          <p className="text-gray-600">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <Suspense fallback={<div className="text-center py-4 text-gray-500">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
