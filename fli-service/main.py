from typing import Optional
import asyncio
import re

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fli.models import (
    Airport, PassengerInfo, SeatType, MaxStops, SortBy,
    FlightSearchFilters, FlightSegment,
)
from fli.search import SearchFlights, SearchDates

app = FastAPI()


def _extract_city(airport_name: str) -> str:
    """
    Extract a display-friendly city name from a full airport name.

    Examples:
      "Kuala Lumpur International Airport" → "Kuala Lumpur"
      "Sydney (Kingsford Smith) Airport"   → "Sydney"
      "Ngurah Rai (Bali) International Airport" → "Bali"
      "Perth Airport" → "Perth"
    """
    # "City (Nickname) Airport" — return the text before the parenthesis
    before_paren = re.match(r'^([^(]+?)\s*\(', airport_name)
    if before_paren:
        city = before_paren.group(1).strip()
        if city:
            return city
    # "(City) Something Airport" — return the parenthesised word
    in_paren = re.search(r'\(([^)]+)\)', airport_name)
    if in_paren:
        return in_paren.group(1)
    # Strip trailing airport-type words
    for suffix in [
        " International Airport", " Int'l Airport", " Intl Airport",
        " Regional Airport", " Airport", " Intl",
    ]:
        if airport_name.lower().endswith(suffix.lower()):
            return airport_name[: -len(suffix)].strip()
    return airport_name


# Destinations to check when discovering cheapest options
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


@app.post("/flights/search")
async def search_flights(req: FlightSearchRequest):
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
        results = SearchFlights().search(filters, currency="AUD")
        return [_serialize_flight(f) for f in (results or [])[:10]]
    except Exception as e:
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
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/flights/top-destinations")
async def top_destinations(req: TopDestinationsRequest):
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
            results = SearchFlights().search(filters, currency="AUD")
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

    valid = [r for r in results if r is not None]
    return sorted(valid, key=lambda x: x["price"])[:10]


@app.get("/health")
def health():
    return {"status": "ok"}
