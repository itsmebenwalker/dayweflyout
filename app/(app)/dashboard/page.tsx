import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarDays, Search, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOffWindows } from '@/lib/roster'
import DashboardDeals from '@/components/deals/DashboardDeals'
import type { Roster } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, rosterRes] = await Promise.all([
    supabase.from('profiles').select('full_name, home_airport').eq('id', user.id).single(),
    supabase
      .from('rosters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.data
  const roster = rosterRes.data as (Roster & { id: string }) | null
  const homeAirport = profile?.home_airport ?? 'PER'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const offWindows = roster ? getOffWindows(roster) : []
  const nextWindow = offWindows[0] ?? null

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Greeting */}
      <h1 className="text-2xl font-semibold text-white mb-1">Hey, {firstName}</h1>
      <p className="text-slate-400 text-sm mb-6">Your FIFO deal finder</p>

      {/* No roster CTA */}
      {!roster && (
        <div className="bg-slate-800 rounded-2xl p-5 mb-5">
          <p className="text-white font-medium mb-1">No roster set up yet</p>
          <p className="text-slate-400 text-sm mb-4">
            Add your swing pattern to find deals for your days off.
          </p>
          <Link
            href="/roster"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
          >
            <CalendarDays size={16} />
            Set up roster
          </Link>
        </div>
      )}

      {/* Next days off */}
      {roster && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="text-sky-400" />
              <span className="text-white font-medium">Your next days off</span>
            </div>
            <Link href="/schedule" className="text-sky-400 text-xs">
              View all
            </Link>
          </div>
          {nextWindow ? (
            <div>
              <p className="text-sky-400 font-semibold text-xl">
                {format(nextWindow.start, 'd MMM')} – {format(nextWindow.end, 'd MMM yyyy')}
              </p>
              <div className="flex items-center gap-3 mt-1 text-slate-400 text-sm">
                <span>{nextWindow.durationNights} days</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  Flying from {homeAirport}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              No upcoming off windows — check your roster settings.
            </p>
          )}
        </div>
      )}

      {/* Deals — stream in via Suspense so greeting renders instantly */}
      {roster && nextWindow && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Cheapest returns for your break</h2>
            <Link
              href={`/search?origin=${homeAirport}&from=${format(nextWindow.start, 'yyyy-MM-dd')}&to=${format(nextWindow.end, 'yyyy-MM-dd')}`}
              className="text-sky-400 text-sm"
            >
              See all 10
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            }
          >
            <DashboardDeals homeAirport={homeAirport} window={nextWindow} />
          </Suspense>
        </>
      )}

      {/* Quick access */}
      <div className="flex gap-3">
        <Link
          href="/roster"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <CalendarDays size={16} className="text-sky-400" />
          {roster ? 'Edit Roster' : 'Set Roster'}
        </Link>
        <Link
          href="/search"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Search size={16} className="text-sky-400" />
          Browse Deals
        </Link>
      </div>
    </div>
  )
}
