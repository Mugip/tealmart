// app/auth/signout/page.tsx
'use client'                                          
import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

export default function SignOutPage() {
  useEffect(() => {                                       // Auto sign out when page loads
    signOut({ redirect: false })
  }, [])                                              
  return (                                                <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-tiffany-600 to-tiffany-400 bg-clip-text text-transparent">
            TealMart
          </h1>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <div className="w-16 h-16 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <LogOut className="w-8 h-8 text-tiffany-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">You've been signed out</h2>
          <p className="text-gray-600 mb-8 text-sm">Thanks for shopping with TealMart. See you again soon!</p>                                                    
          <div className="space-y-3">                             <Link
              href="/"                                              className="block w-full py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-semibold rounded-xl hover:from-tiffany-600 hover:to-tiffany-700 transition-all"
            >
              Continue Shopping                                   </Link>
            <Link
              href="/auth/signin"
              className="block w-full py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-tiffany-300 hover:text-tiffany-700 transition-colors"
            >
              Sign In Again                                       </Link>                                             </div>                                              </div>
      </div>
    </div>                                              )
}
