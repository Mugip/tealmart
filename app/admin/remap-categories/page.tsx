// app/admin/remap-categories/page.tsx
'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, Filter } from 'lucide-react'

export default function RemapCategoriesPage() {
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState<'all' | 'general' | null>(null)
  const [dryRun, setDryRun] = useState(false) // Default to actually doing it
  const [result, setResult] = useState<any>(null)

  const handleRemap = async (type: 'all' | 'general') => {
    if (!dryRun && type === 'all' && !confirm('Are you sure you want to remap ALL products? This could take a while.')) {
      return
    }

    setLoading(true)
    setTarget(type)
    setResult(null)

    const endpoint = type === 'all' 
      ? '/api/admin/categories/remap' 
      : '/api/admin/categories/remap-general'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, useAI: true }), // Force AI on
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to remap')
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
      setTarget(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Remap Product Categories</h1>
        <p className="text-gray-600">Use the Hugging Face AI to clean up and re-classify your products.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        
        {/* Toggle Switch */}
        <label className="flex items-start gap-3 cursor-pointer mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <input 
            type="checkbox" 
            checked={dryRun} 
            onChange={e => setDryRun(e.target.checked)} 
            className="w-5 h-5 text-tiffany-600 rounded mt-0.5" 
          />
          <div>
            <p className="font-bold text-gray-900">Dry Run (Preview Only)</p>
            <p className="text-sm text-gray-600">
              {dryRun 
                ? '✅ Safe mode — shows what would change without updating the database.' 
                : '⚠️ Live mode — will actually update the database!'}
            </p>
          </div>
        </label>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Rescue General Button */}
          <div className="border-2 border-tiffany-200 bg-tiffany-50 rounded-xl p-5 text-center">
            <Filter className="w-10 h-10 text-tiffany-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Rescue "General" Items</h3>
            <p className="text-xs text-gray-600 mb-4 h-10">
              Only analyzes products currently stuck in the "General" category. Processes 50 at a time.
            </p>
            <button 
              onClick={() => handleRemap('general')} 
              disabled={loading} 
              className="w-full bg-tiffany-600 hover:bg-tiffany-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading && target === 'general' ? <RefreshCw className="animate-spin" size={18} /> : null}
              {loading && target === 'general' ? 'Processing...' : 'Fix General Category'}
            </button>
          </div>

          {/* Remap All Button */}
          <div className="border-2 border-red-200 bg-red-50 rounded-xl p-5 text-center">
            <RefreshCw className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Remap EVERYTHING</h3>
            <p className="text-xs text-gray-600 mb-4 h-10">
              Forces the AI to re-evaluate every single product in your entire database.
            </p>
            <button 
              onClick={() => handleRemap('all')} 
              disabled={loading} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading && target === 'all' ? <RefreshCw className="animate-spin" size={18} /> : null}
              {loading && target === 'all' ? 'Processing...' : 'Remap All Products'}
            </button>
          </div>

        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 font-medium flex items-center gap-3">
              <AlertTriangle /> {result.error}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-green-800 font-bold mb-4 text-lg">
                <CheckCircle size={24} /> {result.message}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-2xl font-black text-gray-900">{result.stats?.processedThisBatch || result.stats?.total || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold mt-1">Processed</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-2xl font-black text-tiffany-600">{result.stats?.updated || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold mt-1">Updated</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-2xl font-black text-gray-400">{result.stats?.remainedGeneral || result.stats?.unchanged || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold mt-1">Unchanged</div>
                </div>
                {result.stats?.remainingInDatabase !== undefined && (
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="text-2xl font-black text-orange-500">{result.stats.remainingInDatabase}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold mt-1">Left in DB</div>
                  </div>
                )}
              </div>

              {result.changes && result.changes.length > 0 && (
                <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto p-4 text-sm font-mono space-y-2">
                    {result.changes.map((change: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-50 pb-2">
                        <span className="text-gray-800 truncate flex-1">{change.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">{change.from}</span>
                          <span className="text-gray-300">→</span>
                          <span className="bg-tiffany-100 text-tiffany-700 px-2 py-0.5 rounded text-xs font-bold">{change.to}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
              }
