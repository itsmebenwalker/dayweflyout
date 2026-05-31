from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fli.models import (
    Airport, PassengerInfo, SeatType, MaxStops, SortBy,
    FlightSearchFilters, FlightSegment
)
from fli.search import SearchFlights, SearchDates

app = FastAPI()


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    date: str
    passengers: int = 1


class DateRangeRequest(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str
    trip_duration: int = 0


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


@app.get("/health")
def health():
    return {"status": "ok"}
