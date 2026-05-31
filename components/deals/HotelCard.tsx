import { Hotel, CalendarDays, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  destination: string
  checkin: Date
  checkout: Date
  nights: number
  bookUrl: string
}

export default function HotelCard({ destination, checkin, checkout, nights, bookUrl }: Props) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-white font-medium">
          <Hotel size={18} className="text-sky-400 shrink-0" />
          {destination}
        </span>
        <span className="text-slate-400 text-sm shrink-0">{nights} nights</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <CalendarDays size={13} />
        {format(checkin, 'd MMM')} – {format(checkout, 'd MMM yyyy')}
      </div>

      <p className="text-xs text-slate-500">Prices shown on Booking.com after redirect</p>

      <a
        href={bookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
      >
        Find Hotels
        <ExternalLink size={14} />
      </a>
    </div>
  )
}
