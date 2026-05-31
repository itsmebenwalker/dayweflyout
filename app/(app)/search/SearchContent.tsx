'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { PlaneTakeoff, Hotel, MapPin, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getOffWindows } from '@/lib/roster'
import { buildSkyscannerUrl, buildBookingUrl } from '@/lib/affiliates'
import { AIRPORTS, airportCity } from '@/lib/airports'
import FlightCard from '@/components/deals/FlightCard'
import HotelCard from '@/components/deals/HotelCard'
import type { Flight, Roster, DayWindow } from '@/lib/types'

export default function SearchContent() {
  const searchParams = useSearchParams()

  const [homeAirport, setHomeAirport] = useState(searchParams.get('origin') ?? 'PER')
  const [destination, setDestination] = useState(searchParams.get('dest') ?? '')
  const [windows, setWindows] = useState<DayWindow[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [flights, setFlights] = useState<Flight[]>([])
  const [flightsLoading, setFlightsLoading] = useState(false)
  const [flightsError, setFlightsError] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  // Load user's off windows and profile
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

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

      if (profileRes.data && !searchParams.get('origin')) {
        setHomeAirport(profileRes.data.home_airport)
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

  // Search flights when destination or window changes
  useEffect(() => {
    if (dataLoading || !destination || !selectedWindow) return

    let cancelled = false

    async function run() {
      setFlightsLoading(true)
      setFlightsError('')
      setFlights([])
      try {
        const res = await fetch('/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'search',
            origin: homeAirport,
            destination,
            date: format(selectedWindow!.start, 'yyyy-MM-dd'),
          }),
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
    return () => {
      cancelled = true
    }
  }, [destination, selectedWindow, homeAirport, dataLoading])

  const destCity = airportCity(destination)

  const fallbackFlightUrl =
    destination && selectedWindow
      ? buildSkyscannerUrl({ origin: homeAirport, destination, date: selectedWindow.start })
      : null

  const hotelUrl =
    destination && selectedWindow
      ? buildBookingUrl({
          destination: destCity,
          checkin: selectedWindow.start,
          checkout: selectedWindow.end,
        })
      : null

  if (dataLoading) {
    return (
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        <div className="h-8 w-40 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-12 bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-12 bg-slate-800 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-5">Deals</h1>

      {/* Filter bar */}
      <div className="space-y-3 mb-6">
        {windows.length > 0 && (
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">
              Off window
            </label>
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
              <option key={code} value={code}>
                {city}
              </option>
            ))}
          </datalist>
        </div>
      </div>

      {/* No roster / no windows */}
      {windows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No upcoming off windows found.</p>
          <a href="/roster" className="text-sky-400 text-sm hover:underline">
            Set up your roster
          </a>
        </div>
      )}

      {/* Results */}
      {destination && selectedWindow && (
        <>
          {/* Flights section */}
          <div className="flex items-center gap-2 mb-3">
            <PlaneTakeoff size={17} className="text-sky-400" />
            <h2 className="text-white font-semibold">Flights</h2>
            <span className="text-slate-500 text-sm">
              {homeAirport} → {destination} · {format(selectedWindow.start, 'd MMM')}
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
                  ? 'Live prices unavailable — search directly on Skyscanner.'
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
            <div className="space-y-3 mb-6">
              {flights.map((flight, i) => (
                <FlightCard
                  key={i}
                  flight={flight}
                  bookUrl={buildSkyscannerUrl({
                    origin: homeAirport,
                    destination,
                    date: selectedWindow.start,
                  })}
                />
              ))}
            </div>
          )}

          {/* Hotels section */}
          {hotelUrl && (
            <>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <Hotel size={17} className="text-sky-400" />
                <h2 className="text-white font-semibold">Hotels</h2>
                <span className="text-slate-500 text-sm">{destCity}</span>
              </div>
              <HotelCard
                destination={destCity}
                checkin={selectedWindow.start}
                checkout={selectedWindow.end}
                nights={Math.max(1, selectedWindow.durationNights - 1)}
                bookUrl={hotelUrl}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
