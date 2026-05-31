import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOffWindows } from '@/lib/roster'
import { airportCity } from '@/lib/airports'
import { buildSkyscannerUrl } from '@/lib/affiliates'
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

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
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

  const meta = savedRes.data.metadata as {
    city_name?: string
    trip_type?: 'return' | 'one-way'
    price?: number
    airline?: string
    stops?: number
    duration_minutes?: number
  } | null

  const cityName = meta?.city_name ?? airportCity(destination)
  const tripType = meta?.trip_type ?? 'return'
  const homeAirport = profileRes.data?.home_airport ?? 'PER'
  const travellers = profileRes.data?.travellers ?? 1
  const roster = rosterRes.data as Roster | null
  const offWindows = roster ? getOffWindows(roster) : []
  const gradient = destGradient(destination)

  return (
    <div className="max-w-lg mx-auto">
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${gradient} relative`} style={{ height: '140px' }}>
        <Link
          href="/saved"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          Saved
        </Link>
        <svg viewBox="0 0 360 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <circle cx="20" cy="80" r="6" fill="rgba(255,255,255,0.7)" />
          <circle cx="340" cy="20" r="6" fill="rgba(255,255,255,0.7)" />
          <path d="M 20 80 Q 180 -10 340 20" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="6 6" />
        </svg>
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold leading-tight drop-shadow">{cityName}</h1>
            {meta?.airline && (
              <p className="text-white/70 text-sm mt-0.5">
                {meta.airline}
                {meta.stops === 0 ? ' · direct' : ''}
                {meta.duration_minutes ? ` · ${formatDuration(meta.duration_minutes)}` : ''}
              </p>
            )}
          </div>
          <span className="text-white/60 text-sm font-mono">{destination}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Saved price */}
        {meta?.price && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Price when saved</p>
              <p className="text-white font-bold text-lg">
                A${meta.price}
                <span className="text-slate-400 text-sm font-normal ml-1.5">{tripType}</span>
              </p>
            </div>
            <Link
              href={buildSkyscannerUrl({ origin: homeAirport, destination, date: new Date(), travellers })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-400 text-slate-900 text-sm font-semibold hover:bg-sky-300 transition-colors"
            >
              Book
              <ExternalLink size={13} />
            </Link>
          </div>
        )}

        {/* Off windows */}
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
            const searchUrl = `/search?dest=${destination}&origin=${homeAirport}&from=${format(w.start, 'yyyy-MM-dd')}&to=${format(w.end, 'yyyy-MM-dd')}`
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
                <div className="flex items-center gap-2 text-sky-400 text-sm font-medium shrink-0 ml-3">
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
