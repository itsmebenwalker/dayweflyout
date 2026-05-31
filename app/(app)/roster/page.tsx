'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfDay } from 'date-fns'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Spinner from '@/components/ui/Spinner'
import SwingPatternPicker from '@/components/roster/SwingPatternPicker'
import RosterCalendar from '@/components/roster/RosterCalendar'
import { buildDayMap } from '@/lib/roster'
import type { ManualDay, Roster } from '@/lib/types'
import { AIRPORTS } from '@/lib/airports'
export default function RosterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [rosterId, setRosterId] = useState<string | undefined>()
  const [patternType, setPatternType] = useState<'swing' | 'manual'>('swing')
  const [daysOn, setDaysOn] = useState(14)
  const [daysOff, setDaysOff] = useState(7)
  const [cycleStartDate, setCycleStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [manualDays, setManualDays] = useState<ManualDay[]>([])
  const [homeAirport, setHomeAirport] = useState('PER')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, rosterRes] = await Promise.all([
        supabase.from('profiles').select('home_airport').eq('id', user.id).single(),
        supabase
          .from('rosters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (profileRes.data) setHomeAirport(profileRes.data.home_airport)

      if (rosterRes.data) {
        const r = rosterRes.data as Roster & { id: string }
        setRosterId(r.id)
        setPatternType(r.pattern_type)
        if (r.pattern_type === 'swing') {
          if (r.days_on) setDaysOn(r.days_on)
          if (r.days_off) setDaysOff(r.days_off)
          if (r.cycle_start_date) setCycleStartDate(r.cycle_start_date)
        } else {
          setManualDays(r.manual_days ?? [])
        }
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
    if (!user) {
      setError('Not signed in')
      setSaving(false)
      return
    }

    const rosterPayload = {
      pattern_type: patternType,
      days_on: patternType === 'swing' ? daysOn : null,
      days_off: patternType === 'swing' ? daysOff : null,
      cycle_start_date: patternType === 'swing' ? cycleStartDate : null,
      manual_days: patternType === 'manual' ? manualDays : null,
      updated_at: new Date().toISOString(),
    }

    const profileUpdate = supabase
      .from('profiles')
      .update({ home_airport: homeAirport })
      .eq('id', user.id)
      .then((r) => r.error)

    const rosterUpdate = rosterId
      ? supabase
          .from('rosters')
          .update(rosterPayload)
          .eq('id', rosterId)
          .then((r) => r.error)
      : supabase
          .from('rosters')
          .insert({ ...rosterPayload, user_id: user.id, label: 'My Roster' })
          .select('id')
          .single()
          .then((r) => {
            if (r.data) setRosterId(r.data.id)
            return r.error
          })

    const [profileErr, rosterErr] = await Promise.all([profileUpdate, rosterUpdate])

    if (profileErr || rosterErr) {
      setError('Failed to save. Please try again.')
    } else {
      await new Promise((res) => setTimeout(res, 1500))
      router.push('/dashboard')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="h-8 w-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-56 bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-14 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">Roster</h1>

      {/* Pattern type toggle */}
      <div className="flex bg-slate-800 rounded-xl p-1 mb-5">
        {(['swing', 'manual'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setPatternType(type)
              // Auto-populate manual calendar from swing pattern if no manual days exist yet
              if (type === 'manual' && manualDays.length === 0 && daysOn && daysOff && cycleStartDate) {
                const today = startOfDay(new Date())
                const horizon = addDays(today, 180)
                const dayMap = buildDayMap(
                  { pattern_type: 'swing', days_on: daysOn, days_off: daysOff, cycle_start_date: cycleStartDate, manual_days: null } as Roster,
                  today,
                  horizon,
                )
                const populated: ManualDay[] = []
                dayMap.forEach((dayType, date) => {
                  if (dayType === 'off') populated.push({ date, type: 'off' })
                })
                setManualDays(populated)
              }
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              patternType === type
                ? 'bg-sky-400 text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {type === 'swing' ? 'Swing Pattern' : 'Manual Calendar'}
          </button>
        ))}
      </div>

      {/* Pattern content */}
      {patternType === 'swing' ? (
        <SwingPatternPicker
          daysOn={daysOn}
          daysOff={daysOff}
          cycleStartDate={cycleStartDate}
          onChange={({ daysOn: on, daysOff: off, cycleStartDate: date }) => {
            setDaysOn(on)
            setDaysOff(off)
            setCycleStartDate(date)
          }}
        />
      ) : (
        <RosterCalendar manualDays={manualDays} onChange={setManualDays} />
      )}

      {/* Home airport */}
      <div className="mt-5">
        <label
          htmlFor="homeAirport"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"
        >
          <MapPin size={16} className="text-sky-400" />
          Home airport
        </label>
        <input
          id="homeAirport"
          type="text"
          list="airports-list"
          value={homeAirport}
          onChange={(e) => setHomeAirport(e.target.value.toUpperCase().slice(0, 3))}
          placeholder="e.g. PER"
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors uppercase tracking-widest"
        />
        <datalist id="airports-list">
          {AIRPORTS.map(({ code, city }) => (
            <option key={code} value={code}>
              {city}
            </option>
          ))}
        </datalist>
      </div>

      {/* Error */}
      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 py-3 px-4 rounded-xl bg-sky-400 text-slate-900 font-semibold hover:bg-sky-300 active:bg-sky-500 transition-colors disabled:opacity-60"
      >
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size={16} />
            Saving...
          </span>
        ) : saved ? 'Saved' : 'Save roster'}
      </button>
    </div>
  )
}
