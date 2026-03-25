// components/admin/CJWebhookRegistration.tsx

'use client'

import { useState } from 'react'
import { Link2, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'

export default function CJWebhookRegistration() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  const handleRegister = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/cj/register-webhook', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      setStatus(data.ok ? 'success' : 'error')
    } catch (err: any) {
      setResult({ error: err.message })
      setStatus('error')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Link2 size={18} className="text-tiffany-600" />
            CJ Webhook Registration
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Registers your site with CJ so order status and tracking updates are pushed automatically.
            Run this once after deployment.
          </p>
        </div>

        {status === 'success' && (
          <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-1" />
        )}
        {status === 'error' && (
          <XCircle size={20} className="text-red-500 flex-shrink-0 mt-1" />
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs font-mono text-gray-600 break-all">
        POST /api/webhooks/cj — receives ORDER, LOGISTIC, STOCK events
      </div>

      <button
        onClick={handleRegister}
        disabled={status === 'loading' || status === 'success'}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
          status === 'success'
            ? 'bg-green-100 text-green-700 cursor-default'
            : status === 'error'
            ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            : 'bg-tiffany-500 hover:bg-tiffany-600 text-white'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {status === 'loading' && <Loader2 size={15} className="animate-spin" />}
        {status === 'success' && <CheckCircle size={15} />}
        {status === 'idle' || status === 'error' ? <Link2 size={15} /> : null}

        {status === 'idle' && 'Register Webhook with CJ'}
        {status === 'loading' && 'Registering…'}
        {status === 'success' && 'Webhook Registered ✓'}
        {status === 'error' && 'Retry Registration'}
      </button>

      {result && (
        <div className={`mt-4 rounded-xl p-3 text-sm ${
          result.ok
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {result.ok ? (
            <div>
              <p className="font-semibold mb-1">✓ {result.message}</p>
              <p className="text-xs text-green-600 break-all">URL: {result.webhookUrl}</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold mb-1">✗ {result.error || 'Registration failed'}</p>
              {result.cjResponse?.message && (
                <p className="text-xs">CJ says: {result.cjResponse.message}</p>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        CJ will start sending events immediately after registration. No secret token is needed —
        CJ authenticates by verifying the URL is reachable.
      </p>
    </div>
  )
}
