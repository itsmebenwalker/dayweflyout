import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronRight, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOffWindows } from '@/lib/roster'
import { airportCity } from '@/lib/airports'
import type { Roster } from '@/lib/types'

function destGradient(code: string): string {
  const g = [
    'from-sky-500 to-blue-400',
    'from-blue-500 to-cyan-400',
    'from-sky-600 to-sky-400',
    'from-blue-600 to-sky-500',
    'from-cyan-500 to-blue-400',
    'from-sky-500 to-indigo-400',
    'from-blue-400 to-sky-300',
    'from-sky-600 to-cyan-500',
  ]
  const h = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return g[h % g.length]
}

export default async function SavedDestPage({ params }: { params: Promise<{ dest: string }> }) {
  const { dest } = await params
  const destination = dest.toUpperCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [savedRes, profileRes, rosterRes] = await Promise.all([
    supabase
      .from('saved_deals')
      .select('*')
      .eq('user_id', user.id)
      .eq('destination', destination)
      .eq('deal_type', 'flight')
      .order('saved_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('profiles').select('home_airport, travellers').eq('id', user.id).single(),
    supabase
      .from('rosters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!savedRes.data) notFound()

  const meta = savedRes.data.metadata as { city_name?: string } | null
  const cityName = meta?.city_name ?? airportCity(destination)
  const homeAirport = profileRes.data?.home_airport ?? 'PER'
  const roster = rosterRes.data as Roster | null
  const offWindows = roster ? getOffWindows(roster) : []
  const gradient = destGradient(destination)

  return (
    <div className="max-w-lg mx-auto">
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${gradient} relative`} style={{ height: '140px' }}>
        <svg viewBox="0 0 360 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <circle cx="20" cy="35" r="6" fill="rgba(255,255,255,0.7)" />
          <circle cx="340" cy="15" r="6" fill="rgba(255,255,255,0.7)" />
          <path d="M 20 35 Q 180 -15 340 15" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="6 6" />
        </svg>
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <h1 className="text-white text-2xl font-bold drop-shadow">{cityName}</h1>
          <span className="text-white/60 text-sm font-mono">{destination}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-sky-400" />
          <h2 className="text-white font-semibold">Your upcoming windows</h2>
        </div>

        {offWindows.length === 0 && (
          <div className="bg-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-sm mb-2">No upcoming off windows found.</p>
            <Link href="/roster" className="text-sky-400 text-sm hover:underline">Set up your roster</Link>
          </div>
        )}

        <div className="space-y-3">
          {offWindows.slice(0, 8).map((w, i) => {
            const searchUrl = `/find?dest=${destination}&origin=${homeAirport}&from=${format(w.start, 'yyyy-MM-dd')}&to=${format(w.end, 'yyyy-MM-dd')}`
            return (
              <Link
                key={i}
                href={searchUrl}
                className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors rounded-2xl px-4 py-3.5"
              >
                <div>
                  <p className="text-white font-medium">
                    {format(w.start, 'd MMM')} – {format(w.end, 'd MMM yyyy')}
                  </p>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {w.durationNights} day{w.durationNights !== 1 ? 's' : ''} off · {homeAirport} → {destination}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sky-400 text-sm font-medium shrink-0 ml-3">
                  Search
                  <ChevronRight size={16} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
