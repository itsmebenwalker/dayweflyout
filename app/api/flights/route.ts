import { NextRequest, NextResponse } from 'next/server'
import { searchFlights, cheapestDates, topDestinations } from '@/lib/flights'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, ...params } = body

  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 })
  }

  try {
    if (type === 'search') {
      const { origin, destination, date, passengers, return_date } = params as {
        origin: string
        destination: string
        date: string
        passengers?: number
        return_date?: string
      }
      if (!origin || !destination || !date) {
        return NextResponse.json({ error: 'Missing origin, destination or date' }, { status: 400 })
      }
      const results = await searchFlights({ origin, destination, date, passengers, return_date })
      return NextResponse.json(results)
    }

    if (type === 'cheapest-dates') {
      const { origin, destination, start_date, end_date, trip_duration } = params as {
        origin: string
        destination: string
        start_date: string
        end_date: string
        trip_duration?: number
      }
      if (!origin || !destination || !start_date || !end_date) {
        return NextResponse.json(
          { error: 'Missing origin, destination, start_date or end_date' },
          { status: 400 }
        )
      }
      const results = await cheapestDates({ origin, destination, start_date, end_date, trip_duration })
      return NextResponse.json(results)
    }

    if (type === 'top-destinations') {
      const { origin, date, return_date, passengers } = params as {
        origin: string
        date: string
        return_date?: string
        passengers?: number
      }
      if (!origin || !date) {
        return NextResponse.json({ error: 'Missing origin or date' }, { status: 400 })
      }
      const results = await topDestinations({ origin, date, return_date, passengers })
      return NextResponse.json(results)
    }

    return NextResponse.json(
      { error: 'Invalid type — use "search", "cheapest-dates" or "top-destinations"' },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Flight search failed'
    const status = message.includes('not configured') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
