/**
 * @jest-environment node
 */
import { airportCity, AIRPORTS, POPULAR_DESTINATIONS } from '@/lib/airports'

describe('airportCity', () => {
  it('returns the city name for a known IATA code', () => {
    expect(airportCity('PER')).toBe('Perth')
    expect(airportCity('SYD')).toBe('Sydney')
    expect(airportCity('DPS')).toBe('Bali')
    expect(airportCity('KTA')).toBe('Karratha')
  })

  it('falls back to the IATA code itself for unknown airports', () => {
    expect(airportCity('ZZZ')).toBe('ZZZ')
    expect(airportCity('XYZ')).toBe('XYZ')
  })
})

describe('AIRPORTS', () => {
  it('contains PER as the first entry (default home airport)', () => {
    expect(AIRPORTS[0].code).toBe('PER')
  })

  it('has no duplicate codes', () => {
    const codes = AIRPORTS.map((a) => a.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('every entry has a non-empty code and city', () => {
    AIRPORTS.forEach(({ code, city }) => {
      expect(code.length).toBe(3)
      expect(city.length).toBeGreaterThan(0)
    })
  })
})

describe('POPULAR_DESTINATIONS', () => {
  it('does not include PER (Perth is the most common home airport)', () => {
    expect(POPULAR_DESTINATIONS).not.toContain('PER')
  })

  it('includes Bali (DPS) as a popular destination', () => {
    expect(POPULAR_DESTINATIONS).toContain('DPS')
  })
})
