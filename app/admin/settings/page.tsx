// app/admin/settings/page.tsx - FIXED
'use client'

import { useState, useEffect } from 'react'
import { Save, Lock, Bell, Store, Shield, Database, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [settings, setSettings] = useState({
    storeName: 'TealMart',
    storeEmail: 'support@tealmart.com',
    storePhone: '',
    currency: 'USD',
    orderNotifications: true,
    lowStockAlerts: true,
    dailyReports: false,
    customerMessages: true,
    maintenanceMode: false,
    allowGuestCheckout: true,
    requireEmailVerification: false,
    autoApproveReviews: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Load settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setSettings(s => ({ ...s, ...data }))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Failed to save settings')
      } else {
        setMessage('✓ Settings saved successfully!')
      }
    } catch {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 4000)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }
    setMessage('Password changes require updating ADMIN_PASSWORD_HASH in your environment variables. Use: node -e "const b=require(\'bcryptjs\');console.log(b.hashSync(\'YOUR_NEW_PASSWORD\',10))"')
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'store', label: 'Store', icon: Database },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 text-sm mt-1">Manage your store preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-tiffany-500 text-tiffany-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Store Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settings.storeEmail}
                    onChange={e => setSettings(s => ({ ...s, storeEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={settings.storePhone}
                    onChange={e => setSettings(s => ({ ...s, storePhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tiffany-500"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Admin Password</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <Lock size={14} className="inline mr-2" />
                Admin passwords are stored as bcrypt hashes in your environment variables. To change your password, generate a new hash and update <code className="bg-amber-100 px-1 rounded">ADMIN_PASSWORD_HASH</code> in your <code className="bg-amber-100 px-1 rounded">.env</code> file.
              </div>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-700 border border-gray-200">
                node -e &quot;const b=require(&apos;bcryptjs&apos;);console.log(b.hashSync(&apos;YOUR_NEW_PASSWORD&apos;,10))&quot;
              </div>
              <div className="space-y-3 opacity-60">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                      placeholder="Disabled — use env variable"
                      disabled
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Email Notifications</h3>
              {[
                { key: 'orderNotifications', label: 'New order notifications', desc: 'Email when a new order is placed' },
                { key: 'lowStockAlerts', label: 'Low stock alerts', desc: 'Email when products fall below 10 units' },
                { key: 'dailyReports', label: 'Daily reports', desc: 'Summary email each morning' },
                { key: 'customerMessages', label: 'Customer messages', desc: 'Email when a customer contacts support' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(settings as any)[item.key]}
                    onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 text-tiffany-600 rounded border-gray-300 focus:ring-tiffany-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-tiffany-700">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Store Tab */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Store Behaviour</h3>
              {[
                { key: 'maintenanceMode', label: 'Maintenance mode', desc: 'Temporarily hide the store from visitors', danger: true },
                { key: 'allowGuestCheckout', label: 'Guest checkout', desc: 'Allow purchases without an account' },
                { key: 'requireEmailVerification', label: 'Require email verification', desc: 'Users must verify email before ordering' },
                { key: 'autoApproveReviews', label: 'Auto-approve reviews', desc: 'Publish reviews without manual approval' },
              ].map(item => (
                <label key={item.key} className={`flex items-start gap-3 cursor-pointer group p-3 rounded-lg ${item.danger && (settings as any)[item.key] ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={(settings as any)[item.key]}
                    onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 text-tiffany-600 rounded border-gray-300 focus:ring-tiffany-500"
                  />
                  <div>
                    <p className={`text-sm font-medium ${item.danger && (settings as any)[item.key] ? 'text-red-700' : 'text-gray-900'}`}>{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      {message && (
        <p className={`mb-4 text-sm font-medium ${message.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-tiffany-500 text-white rounded-lg hover:bg-tiffany-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} />
            Save Settings
          </>
        )}
      </button>
    </div>
  )
}
