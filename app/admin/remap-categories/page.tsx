// app/admin/remap-categories/page.tsx
'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react'

export default function RemapCategoriesPage() {
  const [loading, setLoading] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [useAI, setUseAI] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleRemap = async () => {
    if (!dryRun && !confirm('Are you sure you want to remap all product categories? This will update the database.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/categories/remap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, useAI }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to remap')
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Remap Product Categories</h1>
          <p className="text-gray-600 mb-8">Re-classify all products using the keyword scoring engine.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" id="dryRun" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="w-5 h-5 text-blue-600 rounded mt-0.5" />
              <div>
                <label htmlFor="dryRun" className="font-semibold text-gray-900 cursor-pointer">Dry Run (Preview Only)</label>
                <p className="text-sm text-gray-600">{dryRun ? '✅ Safe mode — shows what would change' : '⚠️ Live mode — will update the database'}</p>
              </div>
            </div>

            <button onClick={handleRemap} disabled={loading} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${loading ? 'bg-gray-400' : dryRun ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
              {loading ? 'Processing…' : dryRun ? 'Preview Changes' : 'Remap All Categories'}
            </button>
          </div>

          {result && (
            <div className="space-y-6 animate-in fade-in">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{result.error}</div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-green-800 font-semibold mb-4"><CheckCircle size={20} /> Summary</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><div className="text-2xl font-bold">{result.stats.total}</div><div className="text-sm text-gray-600">Total</div></div>
                    <div><div className="text-2xl font-bold text-green-600">{result.stats.updated}</div><div className="text-sm text-gray-600">Changes</div></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
