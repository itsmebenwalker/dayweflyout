export type DayType = 'work' | 'off'

export interface ManualDay {
  date: string  // YYYY-MM-DD
  type: DayType
}

export interface Roster {
  id?: string
  user_id?: string
  label: string
  pattern_type: 'swing' | 'manual'
  days_on: number | null
  days_off: number | null
  cycle_start_date: string | null  // YYYY-MM-DD
  manual_days: ManualDay[] | null
  created_at?: string
  updated_at?: string
}

export interface DayWindow {
  start: Date
  end: Date
  durationNights: number
}

export interface Profile {
  id: string
  full_name: string | null
  home_airport: string
  travellers: number
  created_at?: string
}

export interface FlightLeg {
  airline: string
  flight_number: string
  departure: string  // ISO datetime string
  arrival: string    // ISO datetime string
  from: string       // IATA code
  to: string         // IATA code
}

export interface Flight {
  price: number
  duration_minutes: number
  stops: number
  legs: FlightLeg[]
}
