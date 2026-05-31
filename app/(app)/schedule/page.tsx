import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { CalendarDays, MapPin, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOffWindows } from '@/lib/roster'
import type { Roster, DayWindow } from '@/lib/types'

function groupByMonth(windows: DayWindow[]): Array<{ month: string; items: DayWindow[] }> {
  const map = new Map<string, DayWindow[]>()
  for (const w of windows) {
    const key = format(w.start, 'MMMM yyyy')
    map.set(key, [...(map.get(key) ?? []), w])
  }
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }))
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const homeAirport = profileRes.data?.home_airport ?? 'PER'
  const roster = rosterRes.data as (Roster & { id: string }) | null
  // 365 days = ~12 months of upcoming off windows
  const windows = roster ? getOffWindows(roster, 2, undefined, 365) : []
  const groups = groupByMonth(windows)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Your schedule</h1>
      <p className="text-slate-400 text-sm mb-6">
        All upcoming days off · next 12 months
      </p>

      {windows.length === 0 && (
        <div className="text-center py-12">
          <CalendarDays size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No upcoming days off found.</p>
          <Link href="/roster" className="text-sky-400 text-sm hover:underline">
            Set up your roster
          </Link>
        </div>
      )}

      <div className="space-y-7">
        {groups.map(({ month, items }) => (
          <div key={month}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              {month}
            </p>
            <div className="space-y-3">
              {items.map((w) => (
                <div
                  key={w.start.toISOString()}
                  className="bg-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold">
                      {format(w.start, 'd MMM')} – {format(w.end, 'd MMM yyyy')}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-slate-400">
                      <span>{w.durationNights} days</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {homeAirport}
                      </span>
                      <span className="text-slate-600 text-xs">
                        {formatDistanceToNowStrict(w.start, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/find?origin=${homeAirport}&from=${format(w.start, 'yyyy-MM-dd')}&to=${format(w.end, 'yyyy-MM-dd')}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-400/10 text-sky-400 text-sm font-medium hover:bg-sky-400/20 transition-colors shrink-0"
                  >
                    <Search size={13} />
                    Deals
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
