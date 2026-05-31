from typing import Optional, Any
import asyncio
import logging
import re
import time

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fli.models import (
    Airport, PassengerInfo, SeatType, MaxStops, SortBy,
    FlightSearchFilters, FlightSegment,
)
from fli.search import SearchFlights, SearchDates

logging.basicConfig(level=logging.INFO)

app = FastAPI()

# ---------------------------------------------------------------------------
# Simple TTL cache — avoids re-hitting Google Flights for repeat searches
# ---------------------------------------------------------------------------
_cache: dict[str, tuple[Any, float]] = {}
_CACHE_TTL = 1800  # 30 minutes


def _cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry and time.time() - entry[1] < _CACHE_TTL:
        return entry[0]
    return None


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (value, time.time())


def _is_rate_limited(exc: Exception) -> bool:
    return "429" in str(exc)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_city(airport_name: str) -> str:
    before_paren = re.match(r'^([^(]+?)\s*\(', airport_name)
    if before_paren:
        city = before_paren.group(1).strip()
        if city:
            return city
    in_paren = re.search(r'\(([^)]+)\)', airport_name)
    if in_paren:
        return in_paren.group(1)
    for suffix in [
        " International Airport", " Int'l Airport", " Intl Airport",
        " Regional Airport", " Airport", " Intl",
    ]:
        if airport_name.lower().endswith(suffix.lower()):
            return airport_name[: -len(suffix)].strip()
    return airport_name


POPULAR_DESTS = ["DPS", "SYD", "MEL", "BNE", "OOL", "CNS", "SIN", "ADL", "DRW", "TSV", "KUL", "BKK"]


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    date: str
    passengers: int = 1
    return_date: Optional[str] = None


class DateRangeRequest(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str
    trip_duration: int = 0


class TopDestinationsRequest(BaseModel):
    origin: str
    date: str
    return_date: Optional[str] = None
    passengers: int = 1


def _build_segments(origin: str, destination: str, date: str, return_date: Optional[str]):
    segments = [
        FlightSegment(
            departure_airport=[[getattr(Airport, origin), 0]],
            arrival_airport=[[getattr(Airport, destination), 0]],
            travel_date=date,
        )
    ]
    if return_date:
        segments.append(
            FlightSegment(
                departure_airport=[[getattr(Airport, destination), 0]],
                arrival_airport=[[getattr(Airport, origin), 0]],
                travel_date=return_date,
            )
        )
    return segments


def _serialize_flight(f):
    return {
        "price": f.price,
        "duration_minutes": f.duration,
        "stops": f.stops,
        "legs": [
            {
                "airline": leg.airline.value,
                "flight_number": leg.flight_number,
                "departure": leg.departure_datetime.isoformat(),
                "arrival": leg.arrival_datetime.isoformat(),
                "from": leg.departure_airport.name,
                "to": leg.arrival_airport.name,
            }
            for leg in f.legs
        ],
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/flights/search")
async def search_flights(req: FlightSearchRequest):
    key = f"search:{req.origin}:{req.destination}:{req.date}:{req.passengers}:{req.return_date}"
    cached = _cache_get(key)
    if cached is not None:
        return cached

    try:
        filters = FlightSearchFilters(
            passenger_info=PassengerInfo(adults=req.passengers),
            flight_segments=_build_segments(
                req.origin, req.destination, req.date, req.return_date
            ),
            seat_type=SeatType.ECONOMY,
            stops=MaxStops.ANY,
            sort_by=SortBy.CHEAPEST,
        )
        results = SearchFlights().search(filters)
        payload = [_serialize_flight(f) for f in (results or [])[:10]]
        _cache_set(key, payload)
        return payload
    except Exception as e:
        logging.exception("search_flights failed: %s", e)
        if _is_rate_limited(e):
            raise HTTPException(status_code=429, detail="Rate limited by Google Flights — try again in a few minutes")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/flights/cheapest-dates")
async def cheapest_dates(req: DateRangeRequest):
    try:
        results = SearchDates().search(
            origin=req.origin,
            destination=req.destination,
            start_date=req.start_date,
            end_date=req.end_date,
            trip_duration=req.trip_duration or None,
        )
        return results or []
    except Exception as e:
        logging.exception("cheapest_dates failed: %s", e)
        if _is_rate_limited(e):
            raise HTTPException(status_code=429, detail="Rate limited by Google Flights — try again in a few minutes")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/flights/top-destinations")
async def top_destinations(req: TopDestinationsRequest):
    key = f"top:{req.origin}:{req.date}:{req.return_date}:{req.passengers}"
    cached = _cache_get(key)
    if cached is not None:
        return cached

    dests = [d for d in POPULAR_DESTS if d != req.origin][:12]

    def _search(dest: str):
        try:
            filters = FlightSearchFilters(
                passenger_info=PassengerInfo(adults=req.passengers),
                flight_segments=_build_segments(
                    req.origin, dest, req.date, req.return_date
                ),
                seat_type=SeatType.ECONOMY,
                stops=MaxStops.ANY,
                sort_by=SortBy.CHEAPEST,
            )
            results = SearchFlights().search(filters)
            if results:
                f = results[0]
                first_leg = f.legs[0] if f.legs else None
                city_name = (
                    _extract_city(first_leg.arrival_airport.value)
                    if first_leg else dest
                )
                return {
                    "destination": dest,
                    "city_name": city_name,
                    "price": f.price,
                    "duration_minutes": f.duration,
                    "stops": f.stops,
                    "airline": first_leg.airline.value if first_leg else "",
                }
        except Exception:
            return None

    try:
        tasks = [asyncio.to_thread(_search, d) for d in dests]
        results = await asyncio.wait_for(asyncio.gather(*tasks), timeout=45.0)
    except asyncio.TimeoutError:
        results = []

    valid = sorted([r for r in results if r is not None], key=lambda x: x["price"])[:10]
    if valid:
        _cache_set(key, valid)
    return valid


@app.get("/health")
def health():
    return {"status": "ok"}
