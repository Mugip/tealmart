// app/admin/cj-orders/page.tsx
import { prisma } from '@/lib/db'
import { Package, Truck, CheckCircle, Clock, AlertTriangle, ArrowRightRight } from 'lucide-react'
import SyncButton from './SyncButton'

export const dynamic = 'force-dynamic'

export default async function CJOrdersPage() {
  const cjOrders = await prisma.cJOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: { orderNumber: true, email: true }
      }
    }
  })

  // Quick stats
  const totalProfit = cjOrders.reduce((sum, o) => sum + (o.totalPaid - o.cjPaymentAmount - o.platformFee), 0)
  const pendingOrders = cjOrders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ArrowRightRight className="text-tiffany-600" /> CJ Dropshipping Orders
          </h1>
          <p className="text-gray-600">Monitor fulfillment, track packages, and calculate profits.</p>
        </div>
        <SyncButton />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-2xl font-black text-gray-900">{cjOrders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Fulfillment</p>
          <p className="text-2xl font-black text-amber-500">{pendingOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Net Profit</p>
          <p className="text-2xl font-black text-green-600">${totalProfit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Webhook Status</p>
          <p className="text-sm font-bold text-tiffany-600 flex items-center gap-1 mt-1">
            <CheckCircle size={16} /> Active
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full block">
        <div className="overflow-x-auto w-full block">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Order Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Customer Paid</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">CJ Cost</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Net Profit</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Tracking</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cjOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No dropshipping orders found yet.
                  </td>
                </tr>
              ) : (
                cjOrders.map((co) => {
                  const profit = co.totalPaid - co.cjPaymentAmount - co.platformFee
                  return (
                    <tr key={co.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900">{co.order.orderNumber}</p>
                        <p className="text-xs text-gray-500">CJ: {co.cjOrderNumber}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900">${co.totalPaid.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Includes ${co.shippingCharged.toFixed(2)} shipping</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-red-600">-${co.cjPaymentAmount.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Includes ${co.shippingCost.toFixed(2)} shipping</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-black ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${profit.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {co.trackingNumber ? (
                          <div>
                            <p className="font-mono text-sm font-bold text-blue-600">{co.trackingNumber}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{co.carrier || 'Standard'}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Awaiting Tracking...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          co.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          co.status === 'SHIPPED' ? 'bg-purple-100 text-purple-700' :
                          co.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {co.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
