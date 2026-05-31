const FLI_SERVICE_URL = process.env.FLI_SERVICE_URL

export async function searchFlights(params: {
  origin: string
  destination: string
  date: string
  passengers?: number
  return_date?: string
}) {
  if (!FLI_SERVICE_URL) throw new Error('FLI_SERVICE_URL not configured')
  const res = await fetch(`${FLI_SERVICE_URL}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error('Flight search failed')
  return res.json()
}

export async function cheapestDates(params: {
  origin: string
  destination: string
  start_date: string
  end_date: string
  trip_duration?: number
}) {
  if (!FLI_SERVICE_URL) throw new Error('FLI_SERVICE_URL not configured')
  const res = await fetch(`${FLI_SERVICE_URL}/flights/cheapest-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Date search failed')
  return res.json()
}

export async function topDestinations(params: {
  origin: string
  date: string
  return_date?: string
  passengers?: number
}) {
  if (!FLI_SERVICE_URL) throw new Error('FLI_SERVICE_URL not configured')
  const res = await fetch(`${FLI_SERVICE_URL}/flights/top-destinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(50_000), // 50s — fli searches 12 dests concurrently
  })
  if (!res.ok) throw new Error('Top destinations search failed')
  return res.json()
}
