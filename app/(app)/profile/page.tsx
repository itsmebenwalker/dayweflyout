'use client'

import { useState, useEffect } from 'react'
import { User, MapPin, LogOut, Plane, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AIRPORTS } from '@/lib/airports'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [homeAirport, setHomeAirport] = useState('PER')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, home_airport')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name ?? '')
        setHomeAirport(profile.home_airport ?? 'PER')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName, home_airport: homeAirport })
      .eq('id', user.id)

    if (err) {
      setError('Failed to save. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handlePasswordReset() {
    if (!email) return
    setResetLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="h-8 w-32 bg-slate-800 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8 mt-2">
        <div className="bg-sky-400/10 rounded-full p-5 mb-3">
          <User size={36} className="text-sky-400" />
        </div>
        <p className="text-white font-semibold text-lg">{fullName || 'Your profile'}</p>
        <p className="text-slate-400 text-sm">{email}</p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5"
          >
            <User size={14} className="text-slate-400" />
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Smith"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="profileAirport"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5"
          >
            <MapPin size={14} className="text-sky-400" />
            Home airport
          </label>
          <input
            id="profileAirport"
            type="text"
            list="profile-airports"
            value={homeAirport}
            onChange={(e) => setHomeAirport(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="PER"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors uppercase tracking-widest"
          />
          <datalist id="profile-airports">
            {AIRPORTS.map(({ code, city }) => (
              <option key={code} value={code}>{city}</option>
            ))}
          </datalist>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1.5">
            <Plane size={14} className="text-slate-400" />
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl bg-sky-400 text-slate-900 font-semibold hover:bg-sky-300 active:bg-sky-500 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {/* Account actions */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={resetLoading || resetSent}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors disabled:opacity-60"
        >
          <KeyRound size={16} />
          {resetSent ? 'Reset email sent — check your inbox' : resetLoading ? 'Sending…' : 'Reset password'}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}
