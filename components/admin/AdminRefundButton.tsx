// components/admin/AdminRefundButton.tsx
'use client'

import { useState } from 'react'
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  orderId: string
  orderTotal: number
  orderNumber: string
}

export default function AdminRefundButton({
  orderId,
  orderTotal,
  orderNumber,
}: Props) {
  const [open, setOpen] = useState(false)
  const [partial, setPartial] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRefund = async () => {
    setLoading(true)

    try {
      const body: any = { reason: 'requested_by_customer' }

      if (partial && amount) {
        const parsed = parseFloat(amount)

        if (isNaN(parsed) || parsed <= 0 || parsed > orderTotal) {
          toast.error('Invalid refund amount')
          setLoading(false)
          return
        }

        body.amount = parsed
      }

      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Refund failed')
      } else {
        toast.success(
          `Refund of $${data.refundAmount.toFixed(2)} issued successfully`
        )
        setOpen(false)
        window.location.reload()
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-sm transition-colors"
      >
        <RefreshCw size={16} />
        Issue Refund
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">Issue Refund</h3>
                <p className="text-sm text-gray-500">
                  Order #{orderNumber}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-sm text-yellow-800">
              ⚠️ This will immediately issue a refund via Stripe and cannot be undone.
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="refund-type"
                  checked={!partial}
                  onChange={() => setPartial(false)}
                  className="text-tiffany-600"
                />
                <span className="text-sm font-medium text-gray-900">
                  Full refund — ${orderTotal.toFixed(2)}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="refund-type"
                  checked={partial}
                  onChange={() => setPartial(true)}
                  className="text-tiffany-600"
                />
                <span className="text-sm font-medium text-gray-900">
                  Partial refund
                </span>
              </label>

              {partial && (
                <div className="ml-7">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={orderTotal}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Max: ${orderTotal.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleRefund}
                disabled={loading || (partial && !amount)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {loading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
                  }
