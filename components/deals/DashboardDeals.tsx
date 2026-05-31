import { format } from 'date-fns'
import { topDestinations } from '@/lib/flights'
import { airportCity } from '@/lib/airports'
import { getUsdToAudRate, convertToAud } from '@/lib/currency'
import DealCard from './DealCard'
import type { DayWindow } from '@/lib/types'

interface Props {
  homeAirport: string
  window: DayWindow
}

interface TopDest {
  destination: string
  city_name?: string
  price: number
  duration_minutes: number
  stops: number
}

export default async function DashboardDeals({ homeAirport, window }: Props) {
  let deals: TopDest[] = []

  try {
    const [raw, rate] = await Promise.all([
      topDestinations({
        origin: homeAirport,
        date: format(window.start, 'yyyy-MM-dd'),
        return_date: format(window.end, 'yyyy-MM-dd'),
      }),
      getUsdToAudRate(),
    ])
    deals = raw.map((d: TopDest) => ({ ...d, price: convertToAud(d.price, rate) }))
  } catch (err) {
    console.error('[DashboardDeals] topDestinations failed:', err)
  }

  if (deals.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4 mb-6">
        Could not load live prices right now.
      </p>
    )
  }

  return (
    <div className="space-y-3 mb-6">
      {deals.slice(0, 5).map((deal) => (
        <DealCard
          key={deal.destination}
          type="flight"
          destination={airportCity(deal.destination)}
          from={window.start}
          to={window.end}
          priceFrom={deal.price}
          href={`/find?origin=${homeAirport}&dest=${deal.destination}&from=${format(window.start, 'yyyy-MM-dd')}&to=${format(window.end, 'yyyy-MM-dd')}`}
        />
      ))}
    </div>
  )
}
