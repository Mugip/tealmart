// app/admin/disputes/page.tsx
import { prisma } from '@/lib/db'
import { AlertCircle, CheckCircle, Clock, Search, XCircle } from 'lucide-react'
import AdminRefundButton from '@/components/admin/AdminRefundButton'

export const dynamic = 'force-dynamic'

export default async function AdminDisputesPage() {
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      order: { select: { total: true, paymentId: true, status: true } }
    }
  })

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <AlertCircle className="text-red-500" /> Return Requests & Disputes
        </h1>
        <p className="text-gray-600">Manage customer returns, view CJ dispute statuses, and process refunds.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full block">
        <div className="overflow-x-auto w-full block">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Order Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Customer Message</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">CJ Ticket ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                    No active return requests or disputes! Your customers are happy.
                  </td>
                </tr>
              ) : (
                disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900">{d.orderNumber}</p>
                      <p className="text-xs text-gray-500">{d.userEmail}</p>
                      <p className="text-xs font-bold text-green-600 mt-1">${d.order.total.toFixed(2)} Paid</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
                        {d.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 line-clamp-2 max-w-xs" title={d.description}>
                        {d.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.cjDisputeId ? (
                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">{d.cjDisputeId}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not sent to CJ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        d.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        d.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {d.order.status !== 'REFUNDED' ? (
                        <AdminRefundButton 
                          orderId={d.orderId} 
                          orderTotal={d.order.total} 
                          orderNumber={d.orderNumber} 
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Refund Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
