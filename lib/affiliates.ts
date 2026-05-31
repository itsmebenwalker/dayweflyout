const SKYSCANNER_ID = process.env.NEXT_PUBLIC_SKYSCANNER_ID || ''
const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID || ''

export function buildSkyscannerUrl(params: {
  origin: string
  destination: string
  date: Date
  returnDate?: Date
  travellers?: number
}): string {
  const adults = params.travellers ?? 1
  const fmt = (d: Date) => {
    const yy = String(d.getFullYear()).slice(2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yy}${mm}${dd}`
  }
  const base = params.returnDate
    ? `https://www.skyscanner.com.au/transport/flights/${params.origin}/${params.destination}/${fmt(params.date)}/${fmt(params.returnDate)}/?adultsv2=${adults}`
    : `https://www.skyscanner.com.au/transport/flights/${params.origin}/${params.destination}/${fmt(params.date)}/?adultsv2=${adults}`
  return SKYSCANNER_ID ? `${base}&associateid=${SKYSCANNER_ID}` : base
}

export function buildBookingUrl(params: {
  destination: string
  checkin: Date
  checkout: Date
  travellers?: number
}): string {
  const adults = params.travellers ?? 1
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const base = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(params.destination)}&checkin=${fmt(params.checkin)}&checkout=${fmt(params.checkout)}&group_adults=${adults}`
  return BOOKING_AID ? `${base}&aid=${BOOKING_AID}` : base
}
