// app/admin/media/page.tsx
'use client'

import { useState } from 'react'
import { Image as ImageIcon, CloudLightning, RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react'

export default function MediaCDNPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/media/migrate', {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to migrate images')
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <ImageIcon className="text-tiffany-600" /> Media & CDN
        </h1>
        <p className="text-gray-600">Migrate dropshipping images to your own Cloudflare R2 bucket for ultimate speed and reliability.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Info Side */}
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CloudLightning className="text-yellow-500" /> Cloudflare R2 Migration
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              When products are ingested, their images point directly to the supplier's servers. 
              By running this tool, your server will automatically download those images, optimize them, 
              upload them to your private Cloudflare R2 bucket, and update your database.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Note:</strong> Because image processing is heavy, this tool processes exactly <strong>10 products per click</strong> to prevent server timeouts.
            </div>
          </div>

          {/* Action Side */}
          <div className="w-full md:w-72 bg-gray-50 rounded-xl p-5 border border-gray-200 text-center flex-shrink-0">
            <Database className="w-10 h-10 text-tiffany-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Migrate Batch</h3>
            <p className="text-xs text-gray-500 mb-4 h-8">
              Process the next 10 products.
            </p>
            <button 
              onClick={handleMigrate} 
              disabled={loading} 
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : null}
              {loading ? 'Migrating Images...' : 'Run Migration'}
            </button>
          </div>

        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 font-medium flex items-center gap-3">
              <AlertTriangle className="flex-shrink-0" /> <span className="text-sm">{result.error}</span>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-green-800 font-bold mb-4 text-lg">
                <CheckCircle size={24} /> {result.message}
              </div>
              
              {result.stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="text-2xl font-black text-gray-900">{result.stats.productsUpdated}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold mt-1">Products Fixed</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="text-2xl font-black text-tiffany-600">{result.stats.imagesMigrated}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold mt-1">Images Saved</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="text-2xl font-black text-orange-500">{result.stats.remainingInDatabase}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold mt-1">Left to Migrate</div>
                  </div>
                </div>
              )}

              {result.logs && result.logs.length > 0 && (
                <div className="bg-white rounded-lg border border-green-100 overflow-hidden mt-4">
                  <div className="max-h-40 overflow-y-auto p-4 text-xs font-mono text-gray-600 space-y-1">
                    {result.logs.map((log: string, i: number) => (
                      <div key={i}>✓ {log}</div>
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
