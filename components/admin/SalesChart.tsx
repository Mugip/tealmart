// components/admin/SalesChart.tsx - FULLY FIXED
'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState } from 'react'

interface ChartData {
  date: string
  revenue: number
  orders: number
}

interface Props {
  data: ChartData[]
}

export default function SalesChart({ data }: Props) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  return (
    <div>
      {/* Chart Type Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setChartType('line')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'line'
                ? 'bg-tiffany-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Line Chart
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'bar'
                ? 'bg-tiffany-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line
                name="Revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#14B8A6"
                strokeWidth={2}
                dot={{ fill: '#14B8A6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                name="Orders"
                type="monotone"
                dataKey="orders"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar name="Revenue" dataKey="revenue" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              <Bar name="Orders" dataKey="orders" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-tiffany-50 rounded-lg border border-tiffany-200">
          <p className="text-sm text-tiffany-700 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-tiffany-900 mt-1">
            ${data.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {data.reduce((sum, d) => sum + d.orders, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
