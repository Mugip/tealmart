// app/admin/login/page.tsx
// Deliberately minimal — no "Admin Panel" branding, no nav, no sidebar.
// Looks like a generic access page so casual visitors don't know what it is.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Use a generic message — never confirm whether the email exists
        setError('Access denied. Check your credentials and try again.')
        return
      }

      // Redirect to admin dashboard on success
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Minimal lock icon — no store logo, no "Admin" label */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
            Restricted Access
          </h1>
          <p className="text-sm text-gray-500 text-center mb-7">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all bg-gray-50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all bg-gray-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>

        {/* No footer links, no "back to store", nothing that hints at admin */}
      </div>
    </div>
  )
            }
