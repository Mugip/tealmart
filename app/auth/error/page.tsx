// app/auth/error/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthError() {
  const params = useSearchParams()
  const error = params.get('error')

  const messages: Record<string, string> = {
    OAuthSignin: 'Could not start Google sign-in.',
    OAuthCallback: 'Google sign-in was cancelled or failed.',
    OAuthAccountNotLinked: 'This email is already registered. Please sign in with email/password.',
    CredentialsSignin: 'Invalid email or password.',
    EmailSignin: 'Email sign-in failed.',
    Callback: 'Authentication callback failed.',
    OAuthCreateAccount: 'Could not create account.',
    SessionRequired: 'Please sign in to continue.',
    default: 'An unexpected error occurred during sign-in.',
  }

  const errorMessage = messages[error ?? 'default'] ?? messages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign-in Error</h1>
        <p className="text-gray-600 mb-6">{errorMessage}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full bg-tiffany-500 text-white font-bold py-3 rounded-lg hover:bg-tiffany-600 transition-colors"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
