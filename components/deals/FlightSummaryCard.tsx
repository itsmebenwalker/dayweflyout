import {
  PlaneTakeoff, PlaneLanding, Clock, GitCommitHorizontal,
  Tag, ExternalLink, ArrowLeftRight,
} from 'lucide-react'
import type { Flight } from '@/lib/types'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

interface Props {
  flights: Flight[]
  bookUrl: string
}

export default function FlightSummaryCard({ flights, bookUrl }: Props) {
  if (flights.length === 0) return null

  const first = flights[0]
  const firstLeg = first.legs[0]
  const lastLeg = first.legs[first.legs.length - 1]

  // Detect round trip
  const isRoundTrip = first.legs.length > 1 && lastLeg.to === firstLeg.from
  const displayTo = isRoundTrip ? firstLeg.to : lastLeg.to

  // Price range
  const prices = flights.map((f) => f.price)
  const priceMin = Math.min(...prices)
  const priceMax = Math.max(...prices)

  // Unique airlines across outbound legs
  const airlines = [
    ...new Set(
      flights.flatMap((f) => {
        const outbound = isRoundTrip
          ? f.legs.slice(0, Math.ceil(f.legs.length / 2))
          : f.legs
        return outbound.map((l) => l.airline)
      })
    ),
  ]

  // Departure times (outbound first leg only)
  const departures = flights
    .map((f) => f.legs[0].departure)
    .sort()
  const earliest = departures[0]
  const latest = departures[departures.length - 1]
  const sameTime = earliest === latest

  // Duration range
  const durations = flights.map((f) => f.duration_minutes)
  const durMin = Math.min(...durations)
  const durMax = Math.max(...durations)

  // Stops text (outbound only for return trips)
  const outboundStops = flights.map((f) => {
    if (!isRoundTrip) return f.stops
    const returnIdx = f.legs.findIndex((l, i) => i > 0 && l.from === firstLeg.to)
    return returnIdx > 0 ? returnIdx - 1 : 0
  })
  const minStops = Math.min(...outboundStops)
  const maxStops = Math.max(...outboundStops)
  const stopsText =
    minStops === 0 && maxStops === 0
      ? 'Direct'
      : minStops === maxStops
      ? `${minStops} stop${minStops > 1 ? 's' : ''}`
      : `Direct – ${maxStops} stop${maxStops > 1 ? 's' : ''}`

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
      {/* Route + price range */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="flex items-center gap-1 text-sm font-semibold text-white shrink-0">
            <PlaneTakeoff size={15} className="text-sky-400" />
            {firstLeg?.from ?? '—'}
          </span>
          <span className="text-slate-600 text-sm shrink-0">→</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-white shrink-0">
            <PlaneLanding size={15} className="text-sky-400" />
            {displayTo ?? '—'}
          </span>
          {isRoundTrip && (
            <span className="flex items-center gap-1 text-xs text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full shrink-0">
              <ArrowLeftRight size={10} />
              Return
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-sky-400 font-bold text-lg shrink-0">
          <Tag size={13} />
          {priceMin === priceMax ? `A$${priceMin}` : `A$${priceMin}–A$${priceMax}`}
        </span>
      </div>

      {/* Departure window */}
      <p className="text-xs text-slate-400">
        Departs{' '}
        {sameTime ? fmtTime(earliest) : `${fmtTime(earliest)} – ${fmtTime(latest)}`}
      </p>

      {/* Duration + stops */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {durMin === durMax
            ? formatDuration(durMin)
            : `${formatDuration(durMin)} – ${formatDuration(durMax)}`}
        </span>
        <span className="flex items-center gap-1">
          <GitCommitHorizontal size={13} />
          {stopsText}
        </span>
      </div>

      {/* Airlines */}
      <p className="text-xs text-slate-500">{airlines.join(', ')}</p>

      {/* CTA */}
      <a
        href={bookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
      >
        {isRoundTrip ? 'Book Return on Skyscanner' : 'Book on Skyscanner'}
        <ExternalLink size={14} />
      </a>
    </div>
  )
}
