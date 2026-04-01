// app/admin/logs/page.tsx
import { prisma } from '@/lib/db'
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const logs = await prisma.ingestionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Show last 100 logs
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Activity className="text-tiffany-600" /> Ingestion Logs
        </h1>
        <p className="text-gray-600">Track automated product imports from CJ Dropshipping.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Source</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Added</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Updated</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.source}</td>
                    <td className="px-6 py-4">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={12} /> Success</span>
                      ) : log.status === 'partial' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><AlertTriangle size={12} /> Partial</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={12} /> Failed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">+{log.productsAdded}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">~{log.productsUpdated}</td>
                    <td className="px-6 py-4 text-red-500 max-w-xs truncate" title={log.errors || ''}>
                      {log.errors || '-'}
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
