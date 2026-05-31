export interface Airport {
  code: string
  city: string
}

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
  { code: 'DPS', city: 'Bali' },
  { code: 'SIN', city: 'Singapore' },
  { code: 'PPP', city: 'Whitsunday Coast' },
  { code: 'MCY', city: 'Sunshine Coast' },
  // International destinations whose airport names don't contain the city name
  { code: 'KUL', city: 'Kuala Lumpur' },
  { code: 'BKK', city: 'Bangkok' },
  { code: 'DMK', city: 'Bangkok' },
  { code: 'NRT', city: 'Tokyo' },
  { code: 'HND', city: 'Tokyo' },
  { code: 'ICN', city: 'Seoul' },
  { code: 'HKG', city: 'Hong Kong' },
  { code: 'CGK', city: 'Jakarta' },
  { code: 'MNL', city: 'Manila' },
]

export function airportCity(code: string): string {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code
}

// Popular leisure destinations for FIFO workers (ordered by demand)
export const POPULAR_DESTINATIONS = ['DPS', 'SYD', 'MEL', 'OOL', 'CNS', 'BNE', 'SIN']
