// app/admin/staff/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const AVAILABLE_PERMISSIONS = [
  { id: 'orders', label: 'Manage Orders', desc: 'Process, fulfill, and refund orders' },
  { id: 'products', label: 'Manage Products', desc: 'Add, edit, or delete products' },
  { id: 'inventory', label: 'Inventory', desc: 'View and update stock levels' },
  { id: 'discounts', label: 'Discounts', desc: 'Create and manage promo codes' },
  { id: 'subscribers', label: 'Subscribers', desc: 'View newsletter subscribers' },
  { id: 'pricing', label: 'Pricing Rules', desc: 'Edit automated markup percentages' },
  { id: 'logs', label: 'Ingestion Logs', desc: 'View CJ Dropshipping sync logs' },
  { id: 'analytics', label: 'Analytics', desc: 'View sales and revenue data' },
  { id: 'settings', label: 'Settings', desc: 'Modify core store settings' },
]

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff')
      if (res.ok) setStaffList(await res.json())
    } catch {}
    setLoading(false)
  }

  const togglePermission = (id: string) => {
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (permissions.length === 0) return toast.error('Select at least one permission')
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, permissions })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Staff account created!')
        setShowForm(false)
        setName(''); setEmail(''); setPassword(''); setPermissions([]);
        fetchStaff()
      } else {
        toast.error(data.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Revoke access and delete this staff member?')) return
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Staff member removed')
        fetchStaff()
      } else {
        toast.error('Failed to remove staff')
      }
    } catch {}
  }

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-tiffany-500" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShieldCheck className="text-tiffany-600" /> Staff Access
          </h1>
          <p className="text-gray-600">Create accounts for your team and restrict what they can see.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {showForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-6">Create Staff Account</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email (Login)</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="jane@tealmart.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Temporary Password</label>
              <input type="text" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Min 8 characters" />
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-3">Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {AVAILABLE_PERMISSIONS.map(p => (
              <label key={p.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${permissions.includes(p.id) ? 'border-tiffany-500 bg-tiffany-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <input type="checkbox" checked={permissions.includes(p.id)} onChange={() => togglePermission(p.id)} className="mt-1 w-4 h-4 text-tiffany-600" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full md:w-auto">
            {submitting ? 'Creating...' : 'Save Staff Member'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Staff Member</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Granted Permissions</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="bg-gray-50">
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">Super Admin (You)</p>
                <p className="text-xs text-gray-500">Configured in .env file</p>
              </td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Unrestricted Access</span></td>
              <td className="px-6 py-4 text-right text-gray-400 text-sm">Cannot be deleted</td>
            </tr>
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.email}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {staff.permissions.map((p: string) => (
                      <span key={p} className="px-2 py-1 bg-tiffany-100 text-tiffany-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(staff.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
