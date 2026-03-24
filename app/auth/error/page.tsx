// app/auth/error/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Could not start Google sign-in. Please try again.',
  OAuthCallback: 'Google sign-in was cancelled or failed.',
  OAuthAccountNotLinked:
    'This email is already registered with a password. Please sign in with email and password instead.',
  CredentialsSignin: 'Invalid email or password.',
  EmailSignin: 'Email sign-in link failed. Please try again.',
  Callback: 'Authentication callback failed.',
  OAuthCreateAccount: 'Could not create your account. Please try again.',
  SessionRequired: 'Please sign in to access this page.',
  default: 'An unexpected error occurred during sign-in.',
}                                                     
function ErrorContent() {
  const params = useSearchParams()
  const error = params.get('error') ?? 'default'
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default                                           
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tiffany-50 via-white to-tiffany-50 px-4">
      <div className="max-w-md w-full">                       <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-tiffany-600 to-tiffany-400 bg-clip-text text-transparent">
              TealMart
            </h1>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
                                                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign-in Error</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>                                   
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full py-3 px-4 bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white font-semibold rounded-xl transition-all shadow-md"
            >                                                       Try Again
            </Link>

            {error === 'OAuthAccountNotLinked' && (
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 px-4 border-2 border-tiffany-300 text-tiffany-600 font-semibold rounded-xl hover:bg-tiffany-50 transition-colors"
              >                                                       Forgot your password?
              </Link>
            )}

            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700 transition-colors pt-2">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>                                              )
}                                                     
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
