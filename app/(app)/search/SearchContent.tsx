'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { PlaneTakeoff, Hotel, MapPin, ExternalLink, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getOffWindows } from '@/lib/roster'
import { buildSkyscannerUrl, buildBookingUrl } from '@/lib/affiliates'
import { AIRPORTS, airportCity } from '@/lib/airports'
import FlightSummaryCard from '@/components/deals/FlightSummaryCard'
import HotelCard from '@/components/deals/HotelCard'
import type { Flight, Roster, DayWindow } from '@/lib/types'

type TripType = 'return' | 'one-way'

interface TopDest {
  destination: string
  city_name?: string  // from fli payload — more accurate than static lookup
  price: number
  duration_minutes: number
  stops: number
  airline: string
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Prefer aircodes (comprehensive); fall back to fli city_name if the code is unknown
function resolveCity(code: string, cityName?: string): string {
  const looked = airportCity(code)
  return looked !== code ? looked : (cityName || code)
}

export default function SearchContent() {
  const searchParams = useSearchParams()

  const [homeAirport, setHomeAirport] = useState(searchParams.get('origin') ?? 'PER')
  const [destination, setDestination] = useState(searchParams.get('dest') ?? '')
  const [tripType, setTripType] = useState<TripType>('return')
  const [travellers, setTravellers] = useState(1)
  const [windows, setWindows] = useState<DayWindow[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [flights, setFlights] = useState<Flight[]>([])
  const [flightsLoading, setFlightsLoading] = useState(false)
  const [flightsError, setFlightsError] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [topDests, setTopDests] = useState<TopDest[]>([])
  const [discovering, setDiscovering] = useState(false)

  // Load user's off windows and profile
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, rosterRes] = await Promise.all([
        supabase.from('profiles').select('home_airport, travellers').eq('id', user.id).single(),
        supabase.from('rosters').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      if (profileRes.data) {
        if (!searchParams.get('origin')) setHomeAirport(profileRes.data.home_airport)
        setTravellers(profileRes.data.travellers ?? 1)
      }
      if (rosterRes.data) {
        const ws = getOffWindows(rosterRes.data as Roster)
        setWindows(ws)
        const fromParam = searchParams.get('from')
        if (fromParam && ws.length > 0) {
          const idx = ws.findIndex((w) => format(w.start, 'yyyy-MM-dd') === fromParam)
          setSelectedIdx(idx >= 0 ? idx : 0)
        }
      }
      setDataLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedWindow = windows[selectedIdx] ?? null

  // Search flights when destination / window / tripType changes
  useEffect(() => {
    if (dataLoading || !destination || !selectedWindow) return

    let cancelled = false

    async function run() {
      setFlightsLoading(true)
      setFlightsError('')
      setFlights([])
      try {
        const body: Record<string, unknown> = {
          type: 'search',
          origin: homeAirport,
          destination,
          date: format(selectedWindow!.start, 'yyyy-MM-dd'),
          passengers: travellers,
        }
        if (tripType === 'return') {
          body.return_date = format(selectedWindow!.end, 'yyyy-MM-dd')
        }
        const res = await fetch('/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Search failed')
        if (!cancelled) setFlights(data)
      } catch (err) {
        if (!cancelled)
          setFlightsError(err instanceof Error ? err.message : 'Failed to load flights')
      } finally {
        if (!cancelled) setFlightsLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [destination, selectedWindow, homeAirport, tripType, travellers, dataLoading])

  // Discover top destinations when no destination is set
  useEffect(() => {
    if (dataLoading || destination || !selectedWindow) return

    let cancelled = false

    async function discover() {
      if (!cancelled) {
        setDiscovering(true)
        setTopDests([])
      }
      try {
        const body: Record<string, unknown> = {
          type: 'top-destinations',
          origin: homeAirport,
          date: format(selectedWindow!.start, 'yyyy-MM-dd'),
        }
        if (tripType === 'return') {
          body.return_date = format(selectedWindow!.end, 'yyyy-MM-dd')
        }
        const res = await fetch('/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok && !cancelled) {
          const data = await res.json()
          setTopDests(data)
        }
      } catch {
        // silent — fallback to manual destination entry
      } finally {
        if (!cancelled) setDiscovering(false)
      }
    }

    discover()
    return () => { cancelled = true }
  }, [destination, selectedWindow, homeAirport, tripType, travellers, dataLoading])

  const destinationCity = airportCity(destination)

  const fallbackFlightUrl =
    destination && selectedWindow
      ? buildSkyscannerUrl({
          origin: homeAirport,
          destination,
          date: selectedWindow.start,
          returnDate: tripType === 'return' ? selectedWindow.end : undefined,
          travellers,
        })
      : null

  const hotelUrl =
    destination && selectedWindow
      ? buildBookingUrl({
          destination: destinationCity,
          checkin: selectedWindow.start,
          checkout: selectedWindow.end,
          travellers,
        })
      : null

  if (dataLoading) {
    return (
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        <div className="h-8 w-40 bg-slate-800 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-5">Deals</h1>

      {/* Filter bar */}
      <div className="space-y-3 mb-6">
        {/* Off window selector */}
        {windows.length > 0 && (
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Off window</label>
            <select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 transition-colors text-sm appearance-none"
            >
              {windows.slice(0, 8).map((w, i) => (
                <option key={i} value={i}>
                  {format(w.start, 'd MMM')} – {format(w.end, 'd MMM')} · {w.durationNights}d
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Trip type toggle */}
        <div className="flex bg-slate-800 rounded-xl p-1">
          {(['return', 'one-way'] as TripType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTripType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tripType === t
                  ? 'bg-sky-400 text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'return' ? 'Return' : 'One-way'}
            </button>
          ))}
        </div>

        {/* Destination */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5">
            <MapPin size={12} />
            Destination
          </label>
          <input
            type="text"
            list="search-airports"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="IATA code — e.g. DPS"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors uppercase tracking-widest"
          />
          <datalist id="search-airports">
            {AIRPORTS.map(({ code, city }) => (
              <option key={code} value={code}>{city}</option>
            ))}
          </datalist>
        </div>
      </div>

      {/* No roster / no windows */}
      {windows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No upcoming off windows found.</p>
          <a href="/roster" className="text-sky-400 text-sm hover:underline">Set up your roster</a>
        </div>
      )}

      {/* Discovery: top destinations when no dest entered */}
      {!destination && selectedWindow && (
        <>
          {discovering && (
            <div className="space-y-3 mb-6">
              <div className="h-6 w-56 bg-slate-800 rounded animate-pulse" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!discovering && topDests.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <PlaneTakeoff size={17} className="text-sky-400" />
                <h2 className="text-white font-semibold">
                  Cheapest {tripType === 'return' ? 'returns' : 'flights'} from {homeAirport}
                </h2>
              </div>
              <div className="space-y-2">
                {topDests.map((dest, i) => (
                  <button
                    key={dest.destination}
                    type="button"
                    onClick={() => setDestination(dest.destination)}
                    className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-2xl px-4 py-3.5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 text-sm font-mono w-4 shrink-0">{i + 1}</span>
                      <div>
                        <p className="text-white font-medium">{resolveCity(dest.destination, dest.city_name)}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {dest.stops === 0 ? 'Direct' : `${dest.stops} stop${dest.stops > 1 ? 's' : ''}`}
                          {' · '}{formatDuration(dest.duration_minutes)}
                          {' · '}{dest.airline}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-slate-500 text-xs block">from</span>
                      <span className="flex items-center gap-1 text-sky-400 font-bold">
                        <Tag size={12} />
                        A${dest.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!discovering && topDests.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">
              Enter a destination above to search for flights.
            </p>
          )}
        </>
      )}

      {/* Results */}
      {destination && selectedWindow && (
        <>
          {/* Hotel section — shown first */}
          {hotelUrl && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Hotel size={17} className="text-sky-400" />
                <h2 className="text-white font-semibold">Hotels</h2>
                <span className="text-slate-500 text-sm">{destinationCity}</span>
              </div>
              <HotelCard
                destination={destinationCity}
                checkin={selectedWindow.start}
                checkout={selectedWindow.end}
                nights={Math.max(1, selectedWindow.durationNights - 1)}
                bookUrl={hotelUrl}
              />
            </div>
          )}

          {/* Flights section */}
          <div className="flex items-center gap-2 mb-3">
            <PlaneTakeoff size={17} className="text-sky-400" />
            <h2 className="text-white font-semibold">Flights</h2>
            <span className="text-slate-500 text-sm">
              {homeAirport} {tripType === 'return' ? '⇄' : '→'} {destination}
              {' · '}{format(selectedWindow.start, 'd MMM')}
              {tripType === 'return' && ` – ${format(selectedWindow.end, 'd MMM')}`}
            </span>
          </div>

          {flightsLoading && (
            <div className="space-y-3 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!flightsLoading && flightsError && (
            <div className="bg-slate-800 rounded-2xl p-4 mb-6">
              <p className="text-slate-400 text-sm mb-3">
                {flightsError.includes('not configured') || flightsError.includes('503')
                  ? 'Live prices unavailable — search on Skyscanner.'
                  : flightsError.includes('429') || flightsError.includes('Rate limited')
                  ? 'Too many searches right now — prices will refresh shortly. Search on Skyscanner in the meantime.'
                  : 'Could not load prices. Try Skyscanner.'}
              </p>
              {fallbackFlightUrl && (
                <a
                  href={fallbackFlightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-400 text-slate-900 font-semibold text-sm hover:bg-sky-300 transition-colors"
                >
                  Search on Skyscanner
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {!flightsLoading && !flightsError && flights.length === 0 && (
            <div className="bg-slate-800 rounded-2xl p-4 mb-6">
              <p className="text-slate-400 text-sm mb-2">No flights found for this route.</p>
              {fallbackFlightUrl && (
                <a
                  href={fallbackFlightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 text-sm hover:underline"
                >
                  Try Skyscanner <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {!flightsLoading && flights.length > 0 && (
            <div className="mb-6">
              <FlightSummaryCard
                flights={flights}
                bookUrl={buildSkyscannerUrl({
                  origin: homeAirport,
                  destination,
                  date: selectedWindow.start,
                  returnDate: tripType === 'return' ? selectedWindow.end : undefined,
                  travellers,
                })}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
