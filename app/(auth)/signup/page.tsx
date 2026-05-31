'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plane, Mail } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      setError('Password must contain uppercase and lowercase letters.')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If session is null, Supabase requires email confirmation before logging in
    if (!data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    // Email confirmation not required — go straight to dashboard
    window.location.href = '/dashboard'
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0F172A]">
        <div className="w-full max-w-sm text-center">
          <div className="bg-sky-400/10 rounded-full p-5 mb-5 inline-flex">
            <Mail size={36} className="text-sky-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Check your inbox</h1>
          <p className="text-slate-400 text-sm mb-1">We sent a confirmation link to</p>
          <p className="text-white font-semibold mb-5">{email}</p>
          <p className="text-slate-500 text-sm mb-8">
            Click the link in the email to verify your address and activate your account.
            The link expires after 24 hours.
          </p>
          <p className="text-slate-600 text-xs">
            Can&apos;t find it? Check your spam folder.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0F172A]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sky-400/10 rounded-2xl p-4 mb-4">
            <Plane size={32} className="text-sky-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">DayWeFlyOut</h1>
          <p className="text-slate-400 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
              placeholder="Alex Smith"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
              placeholder="12+ chars, upper, lower & number"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-400 text-slate-900 font-semibold hover:bg-sky-300 active:bg-sky-500 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
