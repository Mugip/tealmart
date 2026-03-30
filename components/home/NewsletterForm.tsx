// components/home/NewsletterForm.tsx

'use client'

import { useState } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'loading') return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle className="text-white" size={28} />
        </div>
        <p className="text-white font-black text-lg">You&apos;re in!</p>
        <p className="text-teal-100 text-sm">
          Welcome to the TealMart community. Check your inbox soon.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto p-2 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20"
    >
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={status === 'loading'}
        className="flex-1 px-6 py-4 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-0 outline-none font-bold disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === 'loading' || !email}
        className="px-8 py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 min-w-[120px]"
      >
        {status === 'loading' ? (
          <><Loader2 size={16} className="animate-spin" /> Joining...</>
        ) : 'Join Us'}
      </button>
      {status === 'error' && (
        <p className="w-full text-center text-red-200 text-xs mt-1 px-2">{message}</p>
      )}
    </form>
  )
}
