# CLAUDE.md — DayWeFlyOut

> Implementation spec for Claude Code. Read this file before touching any code.

---

## Project Overview

**DayWeFlyOut** is a mobile-first web app for fly-in-fly-out (FIFO) workers. Users input their roster schedule; the app identifies days off and surfaces cheap flights + hotels via affiliate deep links. The app is free to users — revenue is earned through affiliate commissions (Booking.com for hotels, Skyscanner for flights).

**Stack:** Next.js 16 (App Router) · Supabase (auth + database) · Railway (hosting) · Tailwind CSS 4 · TypeScript · Node.js 24 LTS · Python 3.14

---

## Flight Data — `fli` (Google Flights wrapper)

**Source:** https://github.com/punitarani/fli  
**Install:** `pip install flights`

`fli` is a Python library that reverse-engineers the Google Flights API. It returns real prices, airlines, durations, and stop counts — no browser, no scraping. This powers the in-app flight search.

### Architecture

`fli` is Python-only, so it runs as a separate **Python microservice** on Railway alongside the Next.js app. Next.js calls it via internal HTTP.

```
Railway project
├── next-app      (Next.js — port 3000)
└── fli-service   (FastAPI + fli — port 8001)
```

Next.js calls `fli-service` from API routes (server-side only, never from the browser).

### fli-service (`fli-service/`)

Create a minimal FastAPI wrapper:

```
fli-service/
├── main.py
├── requirements.txt
└── railway.toml
```

```python
# fli-service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from fli.models import (
    Airport, PassengerInfo, SeatType, MaxStops, SortBy,
    FlightSearchFilters, FlightSegment
)
from fli.search import SearchFlights, SearchFlightDates

app = FastAPI()

class FlightSearchRequest(BaseModel):
    origin: str        # IATA code e.g. "PER"
    destination: str   # IATA code e.g. "SYD"
    date: str          # YYYY-MM-DD
    passengers: int = 1

class DateRangeRequest(BaseModel):
    origin: str
    destination: str
    start_date: str    # YYYY-MM-DD
    end_date: str      # YYYY-MM-DD
    trip_duration: int = 0  # 0 = one-way

@app.post("/flights/search")
async def search_flights(req: FlightSearchRequest):
    try:
        filters = FlightSearchFilters(
            passenger_info=PassengerInfo(adults=req.passengers),
            flight_segments=[
                FlightSegment(
                    departure_airport=[[getattr(Airport, req.origin), 0]],
                    arrival_airport=[[getattr(Airport, req.destination), 0]],
                    travel_date=req.date,
                )
            ],
            seat_type=SeatType.ECONOMY,
            stops=MaxStops.ANY,
            sort_by=SortBy.CHEAPEST,
        )
        results = SearchFlights().search(filters)
        return [
            {
                "price": f.price,
                "duration_minutes": f.duration,
                "stops": f.stops,
                "legs": [
                    {
                        "airline": leg.airline.value,
                        "flight_number": leg.flight_number,
                        "departure": str(leg.departure_datetime),
                        "arrival": str(leg.arrival_datetime),
                        "from": leg.departure_airport.value,
                        "to": leg.arrival_airport.value,
                    }
                    for leg in f.legs
                ],
            }
            for f in (results or [])[:10]
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flights/cheapest-dates")
async def cheapest_dates(req: DateRangeRequest):
    try:
        results = SearchFlightDates().search(
            origin=req.origin,
            destination=req.destination,
            start_date=req.start_date,
            end_date=req.end_date,
            trip_duration=req.trip_duration or None,
        )
        return results or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
```

```
# fli-service/requirements.txt
fastapi[standard]>=0.115.0
flights
```

```toml
# fli-service/railway.toml
[deploy]
startCommand = "fastapi run main.py --host 0.0.0.0 --port 8001"
```

### Calling fli-service from Next.js

```ts
// lib/flights.ts
const FLI_SERVICE_URL = process.env.FLI_SERVICE_URL // internal Railway URL

export async function searchFlights(params: {
  origin: string
  destination: string
  date: string
  passengers?: number
}) {
  const res = await fetch(`${FLI_SERVICE_URL}/flights/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    next: { revalidate: 1800 }, // cache 30 min
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
  const res = await fetch(`${FLI_SERVICE_URL}/flights/cheapest-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Date search failed')
  return res.json()
}
```

### Key capabilities used

| fli feature | Used for |
|---|---|
| `SearchFlights` | Show real prices + airlines for a specific day |
| `SearchFlightDates` | Find cheapest days within an off-window |
| `sort_by=SortBy.CHEAPEST` | Always surface lowest price first |
| `stops=MaxStops.ANY` | Max flexibility for FIFO routes |

### Risk note

`fli` reverse-engineers Google Flights — it is not an official API. Google may change internals without notice. Monitor the [fli releases page](https://github.com/punitarani/fli/releases) and pin to a specific version in `requirements.txt` (e.g. `flights==0.8.5`). Have a fallback Skyscanner deep link ready if the service goes down.

---

## Affiliate Programs

### Flights — Skyscanner (monetisation layer)
`fli` surfaces the cheapest flights in-app. When a user taps "Book", send them via a Skyscanner affiliate deep link so you earn commission on click-through — even though they discovered the price via Google Flights.

- Apply at: https://www.partners.skyscanner.net
- Deep link format:
  ```
  https://www.skyscanner.com.au/transport/flights/{origin}/{destination}/{YYMMDD}/?adultsv2=1&associateid=YOUR_ID
  ```

### Hotels — Booking.com
- Apply at: https://www.booking.com/affiliate-program
- Deep link format:
  ```
  https://www.booking.com/searchresults.html?ss={destination}&checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&aid=YOUR_AID
  ```

### Graceful fallback — no affiliate ID

If an affiliate ID env var is empty or missing, the link still works — it just omits the tracking parameter. Users land on the same page; we just don't earn commission yet. Never block or hide the booking CTA because of a missing ID.

```ts
// lib/affiliates.ts

const SKYSCANNER_ID = process.env.NEXT_PUBLIC_SKYSCANNER_ID || ''
const BOOKING_AID   = process.env.NEXT_PUBLIC_BOOKING_AID   || ''

export function buildSkyscannerUrl(params: {
  origin: string       // IATA e.g. "PER"
  destination: string  // IATA e.g. "SYD"
  date: Date
}): string {
  const d = params.date
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const dateStr = `${yy}${mm}${dd}`

  const base = `https://www.skyscanner.com.au/transport/flights/${params.origin}/${params.destination}/${dateStr}/?adultsv2=1`
  return SKYSCANNER_ID ? `${base}&associateid=${SKYSCANNER_ID}` : base
}

export function buildBookingUrl(params: {
  destination: string
  checkin: Date
  checkout: Date
}): string {
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const base = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(params.destination)}&checkin=${fmt(params.checkin)}&checkout=${fmt(params.checkout)}`
  return BOOKING_AID ? `${base}&aid=${BOOKING_AID}` : base
}
```

Store affiliate IDs in environment variables (leave blank until approved — links still work):
```
NEXT_PUBLIC_SKYSCANNER_ID=
NEXT_PUBLIC_BOOKING_AID=
```

---

## Repository Structure

```
dayweflyout/
├── fli-service/                # Python microservice — deploy as separate Railway service
│   ├── main.py                 # FastAPI app wrapping fli
│   ├── requirements.txt
│   └── railway.toml
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Bottom nav shell
│   │   ├── home/page.tsx           # Home / upcoming deals
│   │   ├── roster/page.tsx         # Roster input (swing + manual calendar)
│   │   ├── find/page.tsx           # Flight + hotel results (filter chips, top destinations)
│   │   ├── saved/page.tsx          # Saved destinations list
│   │   └── saved/[dest]/page.tsx   # Per-destination off-window tiles
│   ├── api/
│   │   ├── flights/route.ts    # Proxy to fli-service (USD→AUD conversion)
│   │   └── deals/route.ts      # Compute days off, return deals
│   ├── layout.tsx              # Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/                     # Shared primitives (Button, Card, Input, Badge)
│   ├── roster/
│   │   ├── RosterCalendar.tsx  # Manual calendar — auto-highlights swing off days
│   │   └── SwingPatternPicker.tsx
│   ├── deals/
│   │   ├── DealCard.tsx
│   │   ├── FlightCard.tsx      # Shows real price from fli + Book CTA
│   │   ├── HotelCard.tsx
│   │   ├── DashboardDeals.tsx  # Top destinations for next off window
│   │   └── SaveButton.tsx      # Bookmark toggle → saved_deals table
│   └── nav/
│       └── BottomNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client (RSC / route handlers)
│   ├── flights.ts              # fli-service client functions
│   ├── roster.ts               # Days-off computation logic
│   ├── affiliates.ts           # Build Skyscanner/Booking.com deep links
│   ├── currency.ts             # USD→AUD exchange rate (open.er-api.com, 6h cache)
│   └── types.ts
├── supabase/
│   └── migrations/
│       └── 001_init.sql
├── proxy.ts                    # Auth redirect guard + 301 redirects for old routes
├── .env.local                  # Local env vars (never commit)
└── CLAUDE.md                   # This file
```

---

## Database Schema

Run via Supabase migrations (`supabase/migrations/001_init.sql`):

```sql
-- Enable RLS on all tables

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  home_airport text not null default 'PER',  -- IATA code
  created_at timestamptz default now()
);

create table public.rosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text not null default 'My Roster',
  pattern_type text not null check (pattern_type in ('swing', 'manual')),
  -- For swing patterns
  days_on integer,
  days_off integer,
  cycle_start_date date,
  -- For manual entry (stored as array of {date, type} objects)
  manual_days jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.saved_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  deal_type text not null check (deal_type in ('flight', 'hotel', 'package')),
  destination text not null,
  start_date date not null,
  end_date date,
  affiliate_url text not null,
  metadata jsonb,
  saved_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.rosters enable row level security;
alter table public.saved_deals enable row level security;

create policy "Users own their profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users own their rosters" on public.rosters
  for all using (auth.uid() = user_id);

create policy "Users own their saved deals" on public.saved_deals
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Auth

Use Supabase Auth with email/password. No OAuth required for MVP.

- `middleware.ts` — redirect unauthenticated users to `/login`
- Protected routes: everything under `/(app)/`
- Public routes: `/login`, `/signup`, `/`

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Standard Supabase SSR middleware pattern
  // Refresh session, redirect to /login if not authenticated on /home, /roster, /find, /saved, /schedule
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|signup).*)'],
}
```

---

## Core Business Logic

### Roster Types

**Swing pattern** — user defines a repeating cycle, e.g. "14 days on, 7 days off", starting from a known date.

**Manual** — user taps each calendar day and marks it as `work` or `off`.

### Days-Off Computation (`lib/roster.ts`)

```ts
export type DayType = 'work' | 'off'

export interface DayWindow {
  start: Date
  end: Date
  durationNights: number
}

/**
 * Given a roster config, return all contiguous off-day windows
 * within the next 6 months, with duration >= minNights.
 */
export function getOffWindows(roster: Roster, minNights = 2): DayWindow[] {
  // 1. Build a map of date -> DayType for next 180 days
  // 2. Identify contiguous runs of 'off' days
  // 3. Return windows with start, end, durationNights
}
```

### Affiliate Link Builder (`lib/affiliates.ts`)

```ts
export function buildSkyscannerUrl(params: {
  origin: string       // IATA e.g. "PER"
  destination: string  // IATA e.g. "SYD"
  date: Date
}): string

export function buildBookingUrl(params: {
  destination: string  // City name or region
  checkin: Date
  checkout: Date
}): string
```

---

## UI / Design

### Design Principles

- **Mobile-first, app-feel** — fixed bottom navigation, no desktop-style sidebars, no horizontal scroll
- **Card-based results** — each deal is a scannable card with destination, dates, and a clear CTA
- **Minimal chrome** — the roster calendar and deal cards are the hero UI; everything else is reduced
- **No emoji anywhere** — use Lucide React icons exclusively. Emoji make the app feel unfinished.
- Colour palette: deep navy (`#0F172A`) primary, sky blue (`#38BDF8`) accent, white surfaces
- Font: `Geist` (Next.js default) — clean, legible on mobile

### Icons — Lucide React only

All iconography must use `lucide-react`. Never use emoji as icons, labels, or decorative elements anywhere in the UI — not in cards, buttons, nav, toasts, empty states, or loading states.

```tsx
// Correct
import { Plane, Hotel, CalendarDays, Home, User, Search, Bookmark, ChevronRight, Clock, MapPin, Tag } from 'lucide-react'

<Plane size={20} className="text-sky-400" />

// Wrong — never do this
<span>✈️ Flights</span>
```

**Icon map — use these consistently:**

| Concept | Lucide icon |
|---|---|
| Flights / air travel | `Plane` |
| Hotels / accommodation | `Hotel` |
| Calendar / roster | `CalendarDays` |
| Home / dashboard | `Home` |
| Profile / account | `User` |
| Search / deals | `Search` |
| Saved / bookmarked | `Bookmark` |
| Days off | `Coffee` |
| Work days | `HardHat` |
| Departure airport | `MapPin` |
| Duration / time | `Clock` |
| Price | `Tag` |
| Stops (flights) | `GitCommitHorizontal` |
| External link / book | `ExternalLink` |
| Arrow / next | `ChevronRight` |
| Takeoff / landing | `PlaneTakeoff` / `PlaneLanding` |

### Bottom Navigation

Four tabs using Lucide icons — include `aria-label` on each for accessibility:

| Tab | Icon | Route |
|---|---|---|
| Home | `Home` | `/home` |
| Find | `Search` | `/find` |
| Roster | `CalendarDays` | `/roster` |
| Saved | `Bookmark` | `/saved` |

```tsx
// components/nav/BottomNav.tsx
// Fixed to bottom, safe-area-inset aware (pb-safe / env(safe-area-inset-bottom))
// Active tab: accent colour; inactive: muted gray
// Uses next/navigation usePathname for active state
// Lucide icons at size={24}, strokeWidth={1.5}
// No emoji — icons only
```

### Screens

#### `/home` — Home
- Greeting with user name and `User` profile icon link (top right)
- "Your next days off" summary card — `CalendarDays` icon, shows date range and night count
- "Cheapest returns for your break" — top destinations streamed via Suspense
- Quick-access buttons: `CalendarDays` Edit Roster · `Search` Browse Deals

#### `/roster` — Roster Input
- Defaults to **Swing Pattern** tab on every load
- Toggle: **Swing Pattern** | **Manual Calendar**
- **Swing Pattern view:** Days On / Days Off number pickers + cycle start date
- **Manual view:** Month calendar grid — tap to toggle off/work. Switching to Manual auto-populates off days from the swing pattern (via `buildDayMap`) if no manual days exist yet.
- Home airport selector (`MapPin` icon, IATA autocomplete, defaults to PER)
- Save → redirects to `/home`

#### `/find` — Deals
- Off window dropdown (with `ChevronDown` icon) · Return / One-way toggle · Destination input
- Filter chips when no destination entered: **Direct only** · **Domestic** · **Asia** · **Pacific**
- Top destinations list with `SaveButton` (bookmark) on each row
- When destination entered: `Hotel` section + `PlaneTakeoff` flight results with Skyscanner fallback on error
- 429 from Google Flights shows "Too many searches right now" message

#### `/saved` — Saved Destinations
- Cards with gradient header (sky/blue palette, consistent per airport code) + dotted flight path SVG
- Shows price at time of save + "from [next off date]"
- Tap → `/saved/[dest]` detail page

#### `/saved/[dest]` — Destination Detail
- Gradient header (city name + IATA code)
- List of all upcoming off windows — each tile links to `/find?dest=X&from=DATE&to=DATE`
---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# fli microservice (internal Railway URL — set after deploying fli-service)
FLI_SERVICE_URL=http://fli-service.railway.internal:8001

# Affiliate IDs (apply for these — use empty string until approved)
NEXT_PUBLIC_SKYSCANNER_ID=
NEXT_PUBLIC_BOOKING_AID=
```

On Railway: set these in the Railway project's environment variable panel. Never commit `.env.local`.

---

## Railway Deployment

DayWeFlyOut runs as **two Railway services** within one project:

### Service 1: `next-app`
- Root directory: `/` (repo root)
- Framework: Next.js (auto-detected)
- Build command: `npm run build`
- Start command: `npm start`
- Node version: 24 (Active LTS)

### Service 2: `fli-service`
- Root directory: `/fli-service`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8001`
- Python version: 3.14

Once `fli-service` is deployed, copy its internal Railway URL and set it as `FLI_SERVICE_URL` in the `next-app` service variables. Railway private networking means `fli-service` never needs to be public-facing.

Set all `NEXT_PUBLIC_*` variables in the `next-app` Railway service → Variables tab.

---

## Supabase Setup

1. Create project at https://supabase.com
2. Run migration: `supabase db push` (or paste SQL into Supabase SQL editor)
3. Enable email auth: Authentication → Providers → Email → Enable
4. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Settings → API

---

## Key Packages

### Next.js app (Node.js 24 LTS)

Scaffold with:
```bash
npx create-next-app@latest dayweflyout --typescript --tailwind --app
# Installs Next.js 16, React 19, Tailwind 4 automatically
```

Additional packages:
```bash
npm install @supabase/ssr @supabase/supabase-js  # latest
npm install date-fns          # Date arithmetic for roster logic
npm install lucide-react      # Icons
npm install clsx tailwind-merge  # Class utilities
```

### fli-service (Python 3.14)
```
# requirements.txt
fastapi[standard]>=0.115.0  # includes uvicorn[standard] — use `fastapi run` to start
flights==0.8.5              # Pin fli — reverse-engineers Google Flights; monitor releases
```

> Use `python3.14` explicitly when creating virtual environments locally:
> `python3.14 -m venv .venv && source .venv/bin/activate`
>
> On Railway, set the Python version via `PYTHON_VERSION=3.14` environment variable.

---

## MVP Scope — What's In / Out

### In scope
- Email/password auth (sign up, log in, log out)
- Roster input: swing pattern + manual calendar
- Days-off computation (next 6 months)
- Home airport selection
- Affiliate deep links for flights (Skyscanner) and hotels (Booking.com)
- Saved deals (bookmark to profile)
- Mobile-responsive UI with bottom nav

### Out of scope for MVP
- Live flight/hotel pricing API (costs money; use affiliate redirect instead)
- Push notifications for price drops
- Multiple rosters per user
- Social / sharing features
- Native iOS/Android app (PWA is sufficient for MVP)

---

## PWA Configuration

Add to `app/layout.tsx` metadata and create `public/manifest.json`:

```json
{
  "name": "DayWeFlyOut",
  "short_name": "DWFO",
  "start_url": "/home",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

This makes the app installable from Safari/Chrome on mobile — users can add to Home Screen and it opens full-screen with no browser chrome.

---

## Development Order

Build in this sequence to avoid blockers:

1. **Project scaffold** — `npx create-next-app@latest dayweflyout --typescript --tailwind --app  # installs Next.js 16`
2. **fli-service scaffold** — create `fli-service/` with `main.py`, test locally with `uvicorn main:app --reload`
3. **Supabase init** — install packages, create `lib/supabase/client.ts` + `server.ts`, run migration
4. **Auth screens** — `/login` and `/signup` with Supabase email auth
5. **Middleware** — route guard for protected pages
6. **Bottom nav shell** — `/(app)/layout.tsx` with `BottomNav`
7. **Roster page** — swing pattern picker + calendar, save to DB
8. **Days-off logic** — `lib/roster.ts`, unit test the computation
9. **Flight search** — wire `lib/flights.ts` → `/api/flights` → `fli-service`, render `FlightCard` with real prices
10. **Affiliate links** — `lib/affiliates.ts` for "Book" CTAs (Skyscanner for flights, Booking.com for hotels)
11. **Dashboard** — pull active roster, compute next window, render deal cards
12. **Search/Deals page** — full results list with filters
13. **PWA manifest** — add manifest + icons
14. **Deploy to Railway** — deploy `fli-service` first, copy internal URL, then deploy `next-app`

---

*Last updated: generated for DayWeFlyOut MVP — Ben @ GTR AI*
