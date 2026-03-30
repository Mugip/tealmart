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

function formatValue(code: DiscountCode) {
  if (code.type === 'FREE_SHIPPING') return 'Free Shipping'
  if (code.type === 'PERCENTAGE') return `${code.value}% off`
  return `$${code.value.toFixed(2)} off`
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

  // =============================
  // FETCH
  // =============================
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

  // =============================
  // CREATE
  // =============================
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
          value:
            form.type !== 'FREE_SHIPPING'
              ? parseFloat(form.value)
              : 0,
          minPurchase: form.minPurchase
            ? parseFloat(form.minPurchase)
            : null,
          maxUses: form.maxUses
            ? parseInt(form.maxUses)
            : null,
          validUntil: form.validUntil || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Code "${data.code.code}" created!`)

      setForm({
        code: '',
        type: 'PERCENTAGE',
        value: '',
        minPurchase: '',
        maxUses: '',
        validUntil: '',
      })

      setShowForm(false)
      fetchCodes()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create code')
    } finally {
      setSubmitting(false)
    }
  }

  // =============================
  // TOGGLE
  // =============================
  const toggleActive = async (code: DiscountCode) => {
    try {
      await fetch('/api/admin/discounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: code.id,
          isActive: !code.isActive,
        }),
      })

      setCodes(prev =>
        prev.map(c =>
          c.id === code.id ? { ...c, isActive: !c.isActive } : c
        )
      )
    } catch {
      toast.error('Failed to update code')
    }
  }

  // =============================
  // DELETE
  // =============================
  const deleteCode = async (code: DiscountCode) => {
    if (!confirm(`Delete code "${code.code}"?`)) return

    try {
      await fetch(`/api/admin/discounts?id=${code.id}`, {
        method: 'DELETE',
      })

      setCodes(prev => prev.filter(c => c.id !== code.id))
      toast.success('Code deleted')
    } catch {
      toast.error('Failed to delete code')
    }
  }

  // =============================
  // COPY
  // =============================
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Copied "${code}"`)
  }

  // =============================
  // UI
  // =============================
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Tag className="text-teal-600" size={24} />
            Discount Codes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage promotional codes.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
        >
          <Plus size={18} />
          New Code
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tag size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">No discount codes yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold">
                  Discount
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {codes.map(code => {
                const isExpired =
                  code.validUntil &&
                  new Date(code.validUntil) < new Date()

                return (
                  <tr key={code.id} className="border-b">
                    <td className="px-4 py-3 font-mono font-bold">
                      {code.code}
                    </td>

                    <td className="px-4 py-3">
                      {formatValue(code)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {isExpired ? (
                        <span className="text-red-500 text-xs font-bold">
                          Expired
                        </span>
                      ) : (
                        <button onClick={() => toggleActive(code)}>
                          {code.isActive ? (
                            <ToggleRight size={24} />
                          ) : (
                            <ToggleLeft size={24} />
                          )}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right flex gap-2 justify-end">
                      <button onClick={() => copyCode(code.code)}>
                        <Copy size={16} />
                      </button>

                      <button onClick={() => deleteCode(code)}>
                        <Trash2 size={16} />
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
  )
}
