// components/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already accepted/rejected cookies
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after 1 second
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="relative p-6 sm:p-8">
            {/* Close button */}
            <button
              onClick={rejectCookies}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-tiffany-500 to-tiffany-600 rounded-full flex items-center justify-center">
                  <Cookie className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  We Value Your Privacy
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic.
                  By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more in our{' '}
                  <a href="/privacy" className="text-tiffany-600 hover:underline font-medium">
                    Privacy Policy
                  </a>.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={acceptCookies}
                    className="px-6 py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                  >
                    Accept All Cookies
                  </button>
                  <button
                    onClick={rejectCookies}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Reject Non-Essential
                  </button>
                  <a
                    href="/privacy"
                    className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:text-tiffany-600 transition-colors text-center sm:text-left"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Cookie Details (Expandable) */}
          <details className="border-t border-gray-200">
            <summary className="px-6 sm:px-8 py-4 cursor-pointer hover:bg-gray-50 transition-colors font-medium text-gray-700">
              Cookie Details
            </summary>
            <div className="px-6 sm:px-8 py-6 bg-gray-50 space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-600">
                  Required for the website to function properly. These cookies enable basic functions like page navigation, shopping cart, and secure checkout. Cannot be disabled.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Analytics Cookies</h3>
                <p className="text-gray-600">
                  Help us understand how visitors interact with our website by collecting and reporting information anonymously. Used to improve website performance and user experience.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Marketing Cookies</h3>
                <p className="text-gray-600">
                  Used to track visitors across websites and display ads that are relevant and engaging. May be set by third-party advertising partners.
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
