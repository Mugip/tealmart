// app/admin/remap-categories/page.tsx
'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function RemapCategoriesPage() {
  const [loading, setLoading] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [result, setResult] = useState<any>(null)

  const handleRemap = async () => {
    if (!dryRun && !confirm('Are you sure you want to remap all product categories? This will update the database.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/remap-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_INGESTION_API_KEY || 'Craigbes123',
        },
        body: JSON.stringify({ dryRun }),
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
            Update all product categories using the improved classifier
          </p>

          {/* Controls */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <label htmlFor="dryRun" className="font-medium text-gray-900">
                Dry Run (Preview Only)
              </label>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {dryRun
                ? '✅ Safe mode: Will preview changes without updating the database'
                : '⚠️ LIVE mode: Will update all products in the database'}
            </p>

            <button
              onClick={handleRemap}
              disabled={loading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
                ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : dryRun
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
                transition-colors
              `}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
              {loading
                ? 'Processing...'
                : dryRun
                ? 'Preview Changes'
                : 'Remap All Categories'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                    <XCircle size={20} />
                    Error
                  </div>
                  <p className="text-red-700">{result.error}</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                      <CheckCircle size={20} />
                      {result.message}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {result.stats.total}
                        </div>
                        <div className="text-sm text-gray-600">Total Products</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {result.stats.updated}
                        </div>
                        <div className="text-sm text-gray-600">Updated</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-500">
                          {result.stats.unchanged}
                        </div>
                        <div className="text-sm text-gray-600">Unchanged</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {result.stats.errors}
                        </div>
                        <div className="text-sm text-gray-600">Errors</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Completed in {result.stats.duration}
                    </p>
                  </div>

                  {/* Change Summary */}
                  {result.changeSummary && Object.keys(result.changeSummary).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Category Changes Summary
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(result.changeSummary)
                          .sort((a: any, b: any) => b[1] - a[1])
                          .map(([change, count]: any) => (
                            <div
                              key={change}
                              className="flex justify-between items-center py-2 border-b border-gray-100"
                            >
                              <span className="text-gray-700">{change}</span>
                              <span className="font-semibold text-gray-900">
                                {count}x
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Category Distribution */}
                  {result.categoryDistribution && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        New Category Distribution
                      </h3>
                      <div className="space-y-2">
                        {result.categoryDistribution.map((cat: any) => (
                          <div
                            key={cat.category}
                            className="flex justify-between items-center py-2"
                          >
                            <span className="text-gray-700 capitalize">
                              {cat.category.replace('-', ' ')}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-tiffany-600 h-2 rounded-full"
                                  style={{ width: `${cat.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-16 text-right">
                                {cat.count} ({cat.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Changes */}
                  {result.changes && result.changes.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Sample Changes (First 100)
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {result.changes.map((change: any, index: number) => (
                          <div
                            key={index}
                            className="py-2 border-b border-gray-100 text-sm"
                          >
                            <div className="text-gray-900 mb-1">{change.title}</div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                                {change.from}
                              </span>
                              <span>→</span>
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
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

          {/* Warning */}
          {!dryRun && !result && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
              <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                <AlertCircle size={20} />
                Warning
              </div>
              <p className="text-yellow-700">
                You are about to update ALL products in the database. This action
                cannot be easily undone. Make sure you have a database backup!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
