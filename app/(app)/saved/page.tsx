import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getOffWindows } from '@/lib/roster'
import { airportCity } from '@/lib/airports'
import type { Roster } from '@/lib/types'

// Lighter blue gradients — consistent per airport code
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

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rows }, rosterRes] = await Promise.all([
    supabase
      .from('saved_deals')
      .select('*')
      .eq('user_id', user.id)
      .eq('deal_type', 'flight')
      .order('saved_at', { ascending: false }),
    supabase
      .from('rosters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const roster = rosterRes.data as Roster | null
  const offWindows = roster ? getOffWindows(roster) : []
  const nextWindow = offWindows[0] ?? null

  // Deduplicate — keep most recent per destination
  const seen = new Set<string>()
  const deals = (rows ?? []).filter((d) => {
    if (seen.has(d.destination)) return false
    seen.add(d.destination)
    return true
  })

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-5">Saved</h1>

      {deals.length === 0 && (
        <div className="text-center py-16">
          <Bookmark size={36} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Nothing saved yet</p>
          <p className="text-slate-500 text-sm mb-5">
            Tap the bookmark on any destination in Find to save it here.
          </p>
          <Link
            href="/find"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
          >
            Browse Deals
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {deals.map((deal) => {
          const meta = deal.metadata as {
            city_name?: string
            trip_type?: string
            price?: number
            airline?: string
            stops?: number
            duration_minutes?: number
          } | null
          const cityName = meta?.city_name ?? airportCity(deal.destination)
          const gradient = destGradient(deal.destination)

          return (
            <Link
              key={deal.id}
              href={`/saved/${deal.destination}`}
              className="block rounded-2xl overflow-hidden bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 transition-colors"
            >
              {/* Gradient header */}
              <div className={`bg-gradient-to-br ${gradient} h-20 relative`}>
                <svg viewBox="0 0 240 60" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <circle cx="14" cy="48" r="5" fill="rgba(255,255,255,0.75)" />
                  <circle cx="226" cy="12" r="5" fill="rgba(255,255,255,0.75)" />
                  <path d="M 14 48 Q 120 -8 226 12" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none" strokeDasharray="5 5" />
                </svg>
              </div>

              {/* Card body */}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-white font-semibold text-lg leading-tight">{cityName}</p>
                  </div>
                  <span className="text-slate-500 text-xs font-mono mt-1">{deal.destination}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    {nextWindow && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        from {format(nextWindow.start, 'd MMM yyyy')}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-500 shrink-0" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
