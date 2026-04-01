// app/admin/pricing/page.tsx
import { prisma } from '@/lib/db'
import { DollarSign, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPricingPage() {
  const rules = await prisma.pricingRule.findMany({
    orderBy: { category: 'asc' }
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <DollarSign className="text-tiffany-600" /> Pricing Rules
          </h1>
          <p className="text-gray-600">Configure markup percentages and rating filters used by the ingestion engine.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>How it works:</strong> The ingestion script uses these rules to automatically set retail prices. For example, a <code>1.5</code> markup means the cost price from CJ is multiplied by 1.5. Products below the <code>Min Rating</code> are skipped entirely.
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Markup Multiplier</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Min Rating</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No pricing rules found. The ingestion script will use the default 1.3x markup.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900 capitalize">{rule.category.replace('-', ' ')}</td>
                  <td className="px-6 py-4 text-gray-700 font-mono">{rule.markup}x</td>
                  <td className="px-6 py-4 text-gray-700">{rule.minRating} ⭐</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-400">Note: To add or edit rules in this MVP, modify the `PricingRule` table directly in your database using `npm run db:studio`.</p>
    </div>
  )
}
