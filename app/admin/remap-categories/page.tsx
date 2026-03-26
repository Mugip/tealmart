// app/admin/remap-categories.page.tsx

'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react'

export default function RemapCategoriesPage() {
  const [loading, setLoading] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [useAI, setUseAI] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleRemap = async () => {
    if (
      !dryRun &&
      !confirm(
        'Are you sure you want to remap all product categories? This will update the database.'
      )
    ) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/categories/remap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_INGESTION_API_KEY || '',
        },
        body: JSON.stringify({ dryRun, useAI }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remap categories')
      }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Remap Product Categories
          </h1>
          <p className="text-gray-600 mb-8">
            Re-classify all products using the current classifier (keyword scoring + CJ map).
            Optionally enable AI for ambiguous products.
          </p>

          {/* Controls */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 space-y-4">

            {/* Dry run toggle */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={e => setDryRun(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded mt-0.5"
              />
              <div>
                <label htmlFor="dryRun" className="font-semibold text-gray-900 cursor-pointer">
                  Dry Run (Preview Only)
                </label>
                <p className="text-sm text-gray-600">
                  {dryRun
                    ? '✅ Safe mode — shows what would change without touching the database'
                    : '⚠️ Live mode — will update all products in the database'}
                </p>
              </div>
            </div>

            {/* AI toggle */}
            <div className="flex items-start gap-3 pt-2 border-t border-blue-200">
              <input
                type="checkbox"
                id="useAI"
                checked={useAI}
                onChange={e => setUseAI(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded mt-0.5"
              />
              <div>
                <label htmlFor="useAI" className="font-semibold text-gray-900 cursor-pointer flex items-center gap-1.5">
                  <Sparkles size={15} className="text-purple-500" />
                  Use Gemini AI for ambiguous products
                </label>
                <p className="text-sm text-gray-600">
                  Calls Gemini Flash for products where keyword confidence is low.
                  Uses your free-tier quota (1,500 req/day). Only enable this on smaller batches
                  or when re-ingesting products normally covers your full catalog.
                </p>
              </div>
            </div>

            <button
              onClick={handleRemap}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : dryRun
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
              {loading
                ? 'Processing…'
                : dryRun
                ? 'Preview Changes'
                : 'Remap All Categories'}
            </button>
          </div>

          {/* Warning for live mode */}
          {!dryRun && !result && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                <AlertCircle size={20} />
                Warning
              </div>
              <p className="text-yellow-700">
                You are about to update ALL products in the database. This action cannot be easily
                undone. Make sure you have a database backup!
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                    <XCircle size={20} /> Error
                  </div>
                  <p className="text-red-700">{result.error}</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-4">
                      <CheckCircle size={20} />
                      {result.message}
                      {result.dryRun && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Preview
                        </span>
                      )}
                      {result.useAI && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Sparkles size={11} /> AI
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Products', value: result.stats.total, color: 'text-gray-900' },
                        { label: result.dryRun ? 'Would Update' : 'Updated', value: result.stats.updated, color: 'text-green-600' },
                        { label: 'Unchanged', value: result.stats.unchanged, color: 'text-gray-500' },
                        { label: 'Errors', value: result.stats.errors, color: 'text-red-600' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className={`text-2xl font-bold ${color}`}>{value}</div>
                          <div className="text-sm text-gray-600">{label}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Completed in {result.stats.duration}</p>
                  </div>

                  {/* Change summary */}
                  {result.changeSummary && Object.keys(result.changeSummary).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Category Changes Summary</h3>
                      <div className="space-y-2">
                        {Object.entries(result.changeSummary)
                          .sort((a: any, b: any) => b[1] - a[1])
                          .map(([change, count]: any) => (
                            <div key={change} className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                              <span className="text-gray-700">{change}</span>
                              <span className="font-semibold text-gray-900">{count}x</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Category distribution */}
                  {result.categoryDistribution && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        {result.dryRun ? 'Current' : 'New'} Category Distribution
                      </h3>
                      <div className="space-y-2">
                        {result.categoryDistribution.map((cat: any) => (
                          <div key={cat.category} className="flex items-center gap-3 py-1.5">
                            <span className="text-gray-700 text-sm w-44 flex-shrink-0">{cat.category}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-tiffany-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, parseFloat(cat.percentage))}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">
                              {cat.count} ({cat.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample changes */}
                  {result.changes && result.changes.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Sample Changes (first {result.changes.length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {result.changes.map((change: any, i: number) => (
                          <div key={i} className="py-2 border-b border-gray-100 text-sm">
                            <div className="text-gray-900 mb-1.5 font-medium">{change.title}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                                {change.from}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                {change.to}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
      }
                
