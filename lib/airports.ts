import { getAirportByIata } from 'aircodes'

export interface Airport {
  code: string
  city: string
}

// Display-name overrides — used when the aircodes city field isn't the most
// recognisable traveller-facing name for our audience.
const DISPLAY_OVERRIDES: Record<string, string> = {
  PPP: 'Whitsunday Coast',
  OOL: 'Gold Coast',
  MCY: 'Sunshine Coast',
}

export function airportCity(code: string): string {
  if (DISPLAY_OVERRIDES[code]) return DISPLAY_OVERRIDES[code]
  const airport = getAirportByIata(code)
  return airport?.city || code
}

// Subset used for <datalist> autocomplete in form inputs
export const AIRPORTS: Airport[] = [
  { code: 'PER', city: 'Perth' },
  { code: 'SYD', city: 'Sydney' },
  { code: 'MEL', city: 'Melbourne' },
  { code: 'BNE', city: 'Brisbane' },
  { code: 'ADL', city: 'Adelaide' },
  { code: 'DRW', city: 'Darwin' },
  { code: 'CNS', city: 'Cairns' },
  { code: 'OOL', city: 'Gold Coast' },
  { code: 'CBR', city: 'Canberra' },
  { code: 'HBA', city: 'Hobart' },
  { code: 'TSV', city: 'Townsville' },
  { code: 'KTA', city: 'Karratha' },
  { code: 'PHE', city: 'Port Hedland' },
  { code: 'ZNE', city: 'Newman' },
  { code: 'MKY', city: 'Mackay' },
  { code: 'ASP', city: 'Alice Springs' },
  { code: 'GET', city: 'Geraldton' },
  { code: 'DPS', city: 'Denpasar (Bali)' },
  { code: 'SIN', city: 'Singapore' },
  { code: 'PPP', city: 'Whitsunday Coast' },
  { code: 'MCY', city: 'Sunshine Coast' },
  { code: 'KUL', city: 'Kuala Lumpur' },
  { code: 'BKK', city: 'Bangkok' },
  { code: 'NRT', city: 'Tokyo' },
  { code: 'HND', city: 'Tokyo' },
  { code: 'ICN', city: 'Seoul' },
  { code: 'HKG', city: 'Hong Kong' },
  { code: 'CGK', city: 'Jakarta' },
  { code: 'MNL', city: 'Manila' },
]

// Popular leisure destinations for FIFO workers (ordered by demand)
export const POPULAR_DESTINATIONS = ['DPS', 'SYD', 'MEL', 'OOL', 'CNS', 'BNE', 'SIN']
