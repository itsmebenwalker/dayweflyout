# DayWeFlyOut

A mobile-first web app for fly-in-fly-out (FIFO) workers. Enter your roster schedule, find your days off, and instantly surface cheap flights and hotels via affiliate deep links.

**Free for users. Revenue comes from Skyscanner and Booking.com affiliate commissions.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth + Database | Supabase |
| Hosting | Railway |
| Styling | Tailwind CSS 4 |
| Language | TypeScript / Python 3.14 |
| Flight data | `fli` (Google Flights reverse-engineer) via FastAPI microservice |
| Icons | Lucide React |

---

## Prerequisites

- [Node.js 24+](https://nodejs.org)
- [Python 3.14+](https://python.org)
- [Supabase account](https://supabase.com) (free tier is fine)
- [Railway account](https://railway.app) (for deployment — optional for local dev)

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/itsmebenwalker/dayweflyout.git
cd dayweflyout
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your URL and keys
3. Run the database migration:
   - Open the **SQL Editor** in your Supabase dashboard
   - Paste the contents of `supabase/migrations/001_init.sql`
   - Click **Run**
4. Enable email auth: **Authentication → Providers → Email → Enable**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

```bash
# Supabase (from Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# fli-service URL (use localhost during local dev — see step 4)
FLI_SERVICE_URL=http://localhost:8001

# Affiliate IDs — leave blank until approved (links still work)
NEXT_PUBLIC_SKYSCANNER_ID=
NEXT_PUBLIC_BOOKING_AID=
```

### 4. Start the fli-service (flight prices)

The fli-service is a FastAPI Python microservice that reverse-engineers Google Flights. Run it locally alongside the Next.js app.

```bash
cd fli-service
python3.14 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Verify it's running: http://localhost:8001/health

> **Note:** `fli` reverse-engineers Google Flights and is not an official API. Monitor [fli releases](https://github.com/punitarani/fli/releases) for updates. The app falls back gracefully to Skyscanner deep links if the service is unavailable.

### 5. Start the Next.js app

```bash
# Back in the project root
npm run dev
```

Open http://localhost:3000

---

## Scripts

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Start production server
npm test         # Run test suite
npm run lint     # Lint and type-check
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `FLI_SERVICE_URL` | Internal URL of the fli FastAPI service | Yes (for prices) |
| `NEXT_PUBLIC_SKYSCANNER_ID` | Skyscanner affiliate `associateid` | No |
| `NEXT_PUBLIC_BOOKING_AID` | Booking.com affiliate `aid` | No |

> Affiliate ID variables can be left blank — booking CTAs still work, you just won't earn commission until approved.

---

## Affiliate Programs

| Partner | Apply | Commission |
|---|---|---|
| Skyscanner (flights) | [partners.skyscanner.net](https://www.partners.skyscanner.net) | Per click-through |
| Booking.com (hotels) | [booking.com/affiliate-program](https://www.booking.com/affiliate-program) | Per completed booking |

---

## Architecture

```
Railway project
├── next-app        Next.js 16 — port 3000
└── fli-service     FastAPI + fli — port 8001
```

The Next.js app calls `fli-service` server-side only (never from the browser) via `app/api/flights/route.ts`. The internal Railway network URL means `fli-service` never needs to be public-facing.

```
Browser → /api/flights (Next.js route) → fli-service → Google Flights
Browser → Skyscanner affiliate link    (book CTA)
Browser → Booking.com affiliate link   (hotel CTA)
```

### Key files

```
app/
  (auth)/login      Email login page
  (auth)/signup     Sign up page
  (app)/home        Home — next off window + deal cards
  (app)/roster      Swing pattern picker + manual calendar
  (app)/find        Flight and hotel results (filter chips, top destinations)
  (app)/saved       Saved destinations + per-window detail view
  api/flights       Proxy to fli-service
  api/deals         Compute off windows, return deal suggestions
components/
  deals/            FlightCard, HotelCard, DealCard
  roster/           SwingPatternPicker, RosterCalendar
  nav/              BottomNav
lib/
  roster.ts         Days-off computation (getOffWindows)
  affiliates.ts     Skyscanner + Booking.com URL builders
  flights.ts        fli-service HTTP client
  airports.ts       IATA code to city name lookup
fli-service/
  main.py           FastAPI wrapper for fli
```

---

## Deploying to Railway

### 1. Deploy fli-service first

1. Create a new Railway project
2. Add a service, connect your GitHub repo
3. Set **Root Directory** to `/fli-service`
4. Set environment variable: `PYTHON_VERSION=3.14`
5. Deploy — Railway uses the `startCommand` in `fli-service/railway.toml`
6. Copy the service's **internal** Railway URL (e.g. `http://fli-service.railway.internal:8001`)

### 2. Deploy next-app

1. Add a second service in the same Railway project
2. Connect the same GitHub repo, Root Directory = `/`
3. Set environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FLI_SERVICE_URL=http://fli-service.railway.internal:8001
NEXT_PUBLIC_SKYSCANNER_ID=
NEXT_PUBLIC_BOOKING_AID=
```

4. Deploy

### 3. Database

Run `supabase db push` or paste `supabase/migrations/001_init.sql` into the Supabase SQL Editor.

---

## PWA

The app is installable on iOS and Android. From Safari or Chrome, tap **Share → Add to Home Screen**. It opens full-screen with no browser chrome.

Icons are generated from `public/logo-mark.svg`. To regenerate after updating the logo:

```bash
brew install librsvg
rsvg-convert -w 192 -h 192 public/logo-mark.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 public/logo-mark.svg -o public/icon-512.png
```

---

## Database Schema

Three tables with Row Level Security — users can only read and write their own data.

| Table | Purpose |
|---|---|
| `profiles` | User name and home airport (IATA code) |
| `rosters` | Swing pattern or manual calendar data |
| `saved_deals` | Bookmarked flights and hotels |

See `supabase/migrations/001_init.sql` for the full schema.
