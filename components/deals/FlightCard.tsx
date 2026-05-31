import { PlaneTakeoff, PlaneLanding, Clock, GitCommitHorizontal, Tag, ExternalLink, ArrowLeftRight } from 'lucide-react'
import { format } from 'date-fns'
import type { Flight } from '@/lib/types'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface Props {
  flight: Flight
  bookUrl: string
}

export default function FlightCard({ flight, bookUrl }: Props) {
  const firstLeg = flight.legs[0]
  const lastLeg = flight.legs[flight.legs.length - 1]

  // Detect round trip: last leg returns to the departure airport
  const isRoundTrip =
    flight.legs.length > 1 &&
    firstLeg &&
    lastLeg &&
    lastLeg.to === firstLeg.from

  // For display: always show outbound route (firstLeg.from → firstLeg.to)
  // For one-way, lastLeg.to is the final destination
  const displayTo = isRoundTrip ? firstLeg?.to : lastLeg?.to

  // Find where the return leg starts (first leg departing from the destination)
  const returnLeg = isRoundTrip
    ? flight.legs.find((leg, i) => i > 0 && leg.from === firstLeg?.to)
    : null

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
      {/* Route + price */}
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
          ${flight.price}
        </span>
      </div>

      {/* Outbound departure */}
      {firstLeg && (
        <p className="text-xs text-slate-400">
          Departs{' '}
          {new Date(firstLeg.departure).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
          {isRoundTrip && returnLeg && (
            <span className="ml-3 text-slate-500">
              Returns{' '}
              {format(new Date(returnLeg.departure), 'd MMM')}{' '}
              {new Date(returnLeg.departure).toLocaleTimeString('en-AU', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          )}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {formatDuration(flight.duration_minutes)}
        </span>
        <span className="flex items-center gap-1">
          <GitCommitHorizontal size={13} />
          {flight.stops === 0
            ? 'Direct'
            : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
        </span>
        {firstLeg && (
          <span className="text-slate-500 text-xs truncate">{firstLeg.airline}</span>
        )}
      </div>

      {/* CTA */}
      <a
        href={bookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
      >
        {isRoundTrip ? 'Book Return Flight' : 'Book Flight'}
        <ExternalLink size={14} />
      </a>
    </div>
  )
}
