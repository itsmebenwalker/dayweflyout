import { PlaneTakeoff, PlaneLanding, Clock, GitCommitHorizontal, Tag, ExternalLink } from 'lucide-react'
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

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
      {/* Route + price */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-sm font-medium text-white shrink-0">
            <PlaneTakeoff size={15} className="text-sky-400" />
            {firstLeg?.from ?? '—'}
          </span>
          <span className="text-slate-600 text-sm">→</span>
          <span className="flex items-center gap-1 text-sm font-medium text-white shrink-0">
            <PlaneLanding size={15} className="text-sky-400" />
            {lastLeg?.to ?? '—'}
          </span>
        </div>
        <span className="flex items-center gap-1 text-sky-400 font-bold text-lg shrink-0">
          <Tag size={13} />
          ${flight.price}
        </span>
      </div>

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

      {/* Departure time */}
      {firstLeg && (
        <p className="text-xs text-slate-500">
          Departs{' '}
          {new Date(firstLeg.departure).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
      )}

      {/* CTA */}
      <a
        href={bookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
      >
        Book Flight
        <ExternalLink size={14} />
      </a>
    </div>
  )
}
