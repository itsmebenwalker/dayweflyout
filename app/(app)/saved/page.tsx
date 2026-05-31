import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { airportCity } from '@/lib/airports'

// Deterministic gradient per airport code
function destGradient(code: string): string {
  const g = [
    'from-blue-800 to-blue-600',
    'from-slate-700 to-slate-500',
    'from-teal-800 to-emerald-600',
    'from-violet-800 to-purple-600',
    'from-rose-800 to-orange-600',
    'from-cyan-800 to-sky-600',
    'from-indigo-800 to-blue-600',
    'from-green-800 to-teal-600',
  ]
  const h = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return g[h % g.length]
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('saved_deals')
    .select('*')
    .eq('user_id', user.id)
    .eq('deal_type', 'flight')
    .order('saved_at', { ascending: false })

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
            Tap the bookmark on any destination in Deals to save it here.
          </p>
          <Link
            href="/search"
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
              href={`/search?dest=${deal.destination}`}
              className="block rounded-2xl overflow-hidden bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {/* Gradient header with flight path */}
              <div className={`bg-gradient-to-br ${gradient} h-20 relative`}>
                <svg
                  viewBox="0 0 240 60"
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                >
                  <circle cx="14" cy="48" r="5" fill="rgba(255,255,255,0.75)" />
                  <circle cx="226" cy="12" r="5" fill="rgba(255,255,255,0.75)" />
                  <path
                    d="M 14 48 Q 120 -8 226 12"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="5 5"
                  />
                </svg>
              </div>

              {/* Card body */}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-white font-semibold text-lg leading-tight">{cityName}</p>
                    {meta?.airline && (
                      <p className="text-slate-400 text-sm">
                        {meta.airline}
                        {meta.stops === 0 ? ' · direct' : meta.stops != null ? ` · ${meta.stops} stop${meta.stops > 1 ? 's' : ''}` : ''}
                        {meta.duration_minutes ? ` · ${formatDuration(meta.duration_minutes)}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs font-mono mt-1">{deal.destination}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  {meta?.price ? (
                    <p className="text-white">
                      <span className="text-2xl font-bold">A${meta.price}</span>
                      <span className="text-slate-400 text-sm ml-1.5">{meta.trip_type ?? 'return'}</span>
                    </p>
                  ) : (
                    <p className="text-slate-400 text-sm">Tap to find current prices</p>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 text-sky-400 text-sm font-semibold hover:bg-slate-600 transition-colors">
                    Find flights
                    <ExternalLink size={13} />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
