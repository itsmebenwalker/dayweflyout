import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOffWindows } from '@/lib/roster'
import { airportCity, POPULAR_DESTINATIONS } from '@/lib/airports'
import { format } from 'date-fns'
import type { Roster } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profileRes, rosterRes] = await Promise.all([
    supabase.from('profiles').select('home_airport').eq('id', user.id).single(),
    supabase
      .from('rosters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const homeAirport = profileRes.data?.home_airport ?? 'PER'
  const roster = rosterRes.data as (Roster & { id: string }) | null
  const windows = roster ? getOffWindows(roster) : []
  const nextWindow = windows[0] ?? null

  if (!nextWindow) return NextResponse.json([])

  const dests = POPULAR_DESTINATIONS.filter((d) => d !== homeAirport).slice(0, 3)

  const deals = dests.map((iata) => ({
    type: 'flight',
    destination: airportCity(iata),
    iata,
    origin: homeAirport,
    from: format(nextWindow.start, 'yyyy-MM-dd'),
    to: format(nextWindow.end, 'yyyy-MM-dd'),
    nights: nextWindow.durationNights,
    href: `/search?origin=${homeAirport}&dest=${iata}&from=${format(nextWindow.start, 'yyyy-MM-dd')}&to=${format(nextWindow.end, 'yyyy-MM-dd')}`,
  }))

  return NextResponse.json(deals)
}
