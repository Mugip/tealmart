// app/admin/discounts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  Copy,
  X,
  Calendar,
  DollarSign,
  Hash,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DiscountCode {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'
  value: number
  minPurchase: number | null
  maxUses: number | null
  usedCount: number
  validUntil: string | null
  isActive: boolean
  createdAt: string
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    maxUses: '',
    validUntil: '',
  })

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/admin/discounts')
      const data = await res.json()
      setCodes(data.codes ?? [])
    } catch {
      toast.error('Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: form.type !== 'FREE_SHIPPING' ? parseFloat(form.value) : 0,
          minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : null,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          validUntil: form.validUntil || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Code "${data.code.code}" created!`)
      setForm({ code: '', type: 'PERCENTAGE', value: '', minPurchase: '', maxUses: '', validUntil: '' })
      setShowForm(false)
      fetchCodes()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create code')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (code: DiscountCode) => {
    const originalState = code.isActive
    // Optimistic UI update
    setCodes(prev => prev.map(c => c.id === code.id ? { ...c, isActive: !c.isActive } : c))

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, isActive: !code.isActive }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error('Failed to update')
      // Revert if failed
      setCodes(prev => prev.map(c => c.id === code.id ? { ...c, isActive: originalState } : c))
    }
  }

  const deleteCode = async (code: DiscountCode) => {
    if (!confirm(`Delete code "${code.code}"?`)) return
    try {
      await fetch(`/api/admin/discounts?id=${code.id}`, { method: 'DELETE' })
      setCodes(prev => prev.filter(c => c.id !== code.id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Tag className="text-tiffany-600" size={32} />
            Promotions
          </h1>
          <p className="text-gray-500 font-medium">Manage discount codes and store-wide sales.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
            showForm ? 'bg-gray-100 text-gray-600' : 'bg-tiffany-600 text-white hover:bg-tiffany-700'
          }`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Discount'}
        </button>
      </div>

      {/* 2. CREATION FORM (The Missing Piece) */}
      {showForm && (
        <div className="bg-white rounded-[2rem] border-2 border-tiffany-100 p-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Promo Code</label>
              <input 
                required 
                placeholder="e.g. SUMMER50"
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-tiffany-500 outline-none uppercase"
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
              <select 
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-tiffany-500 outline-none"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>

            {form.type !== 'FREE_SHIPPING' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    {form.type === 'PERCENTAGE' ? '%' : '$'}
                  </span>
                  <input 
                    type="number" required
                    className="w-full bg-gray-50 border-none rounded-2xl pl-8 pr-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-tiffany-500 outline-none"
                    value={form.value}
                    onChange={e => setForm({...form, value: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Min. Order ($)</label>
              <input 
                type="number" placeholder="Optional"
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-tiffany-500 outline-none"
                value={form.minPurchase}
                onChange={e => setForm({...form, minPurchase: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
              <input 
                type="date"
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-tiffany-500 outline-none"
                value={form.validUntil}
                onChange={e => setForm({...form, validUntil: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20}/> Create Promo</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. QUICK STATS BAR */}
      {!loading && codes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total Codes</p>
            <p className="text-2xl font-black text-gray-900">{codes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Active Now</p>
            <p className="text-2xl font-black text-emerald-600">{codes.filter(c => c.isActive).length}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Used Count</p>
            <p className="text-2xl font-black text-tiffany-600">{codes.reduce((acc, c) => acc + c.usedCount, 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Expired</p>
            <p className="text-2xl font-black text-orange-500">{codes.filter(c => c.validUntil && new Date(c.validUntil) < new Date()).length}</p>
          </div>
        </div>
      )}

      {/* 4. TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-tiffany-600" size={40} /></div>
        ) : codes.length === 0 ? (
          <div className="py-32 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Tag size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold">No promotions running yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Promo Code</th>
                  <th className="px-8 py-5">Benefit</th>
                  <th className="px-8 py-5">Min Order</th>
                  <th className="px-8 py-5">Usage</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {codes.map(code => {
                  const isExpired = code.validUntil && new Date(code.validUntil) < new Date()
                  
                  return (
                    <tr key={code.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-gray-900 font-mono text-base uppercase bg-gray-100 px-3 py-1 rounded-lg">
                            {code.code}
                          </span>
                          <button 
                            onClick={() => {navigator.clipboard.writeText(code.code); toast.success('Copied!')}}
                            className="text-gray-300 hover:text-tiffany-600 transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-bold text-gray-900">
                          {code.type === 'FREE_SHIPPING' ? '🚚 Free Shipping' : 
                           code.type === 'PERCENTAGE' ? `🔥 ${code.value}% OFF` : 
                           `💰 $${code.value.toFixed(2)} OFF`}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-bold text-gray-500">
                        {code.minPurchase ? `$${code.minPurchase.toFixed(2)}+` : '—'}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <span className="text-gray-900 font-bold">{code.usedCount}</span>
                           <span className="text-gray-400 text-xs">/ {code.maxUses || '∞'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {isExpired ? (
                          <span className="bg-red-50 text-red-500 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-100">Expired</span>
                        ) : (
                          <button onClick={() => toggleActive(code)} className="transition-transform hover:scale-110">
                            {code.isActive ? 
                              <ToggleRight className="text-emerald-500" size={32} /> : 
                              <ToggleLeft className="text-gray-300" size={32} />
                            }
                          </button>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => deleteCode(code)}
                          className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
          }
