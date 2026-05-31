declare module 'aircodes' {
  interface AirportData {
    iata: string
    icao: string
    name: string
    city: string
    state: string
    country: string
  }

  export function getAirportByIata(iataCode: string): AirportData | null
  export function getAirportByIcao(icaoCode: string): AirportData | null
  export function findAirport(query: string): AirportData[]
}
