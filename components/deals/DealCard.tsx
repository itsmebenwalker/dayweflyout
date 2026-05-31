import Link from 'next/link'
import { format } from 'date-fns'
import { PlaneTakeoff, Hotel, CalendarDays, ChevronRight } from 'lucide-react'

interface Props {
  type: 'flight' | 'hotel'
  destination: string
  from: Date
  to: Date
  priceFrom?: number
  href: string
}

export default function DealCard({ type, destination, from, to, priceFrom, href }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 active:bg-slate-600 transition-colors"
    >
      <div className="bg-sky-400/10 rounded-xl p-2.5 shrink-0">
        {type === 'flight' ? (
          <PlaneTakeoff size={20} className="text-sky-400" />
        ) : (
          <Hotel size={20} className="text-sky-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{destination}</p>
        <p className="flex items-center gap-1 text-slate-400 text-sm mt-0.5">
          <CalendarDays size={12} />
          {format(from, 'd MMM')} – {format(to, 'd MMM')}
        </p>
        {priceFrom !== undefined && (
          <p className="text-sky-400 text-sm font-semibold mt-0.5">from ${priceFrom}</p>
        )}
      </div>

      <ChevronRight size={18} className="text-slate-500 shrink-0" />
    </Link>
  )
}
