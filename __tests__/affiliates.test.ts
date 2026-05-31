/**
 * @jest-environment node
 */
import { buildSkyscannerUrl, buildBookingUrl } from '@/lib/affiliates'

describe('buildSkyscannerUrl', () => {
  it('builds the correct base URL', () => {
    const url = buildSkyscannerUrl({
      origin: 'PER',
      destination: 'SYD',
      date: new Date(2025, 5, 15), // Jun 15 2025 local time
    })
    expect(url).toBe(
      'https://www.skyscanner.com.au/transport/flights/PER/SYD/250615/?adultsv2=1'
    )
  })

  it('zero-pads single-digit months and days', () => {
    const url = buildSkyscannerUrl({
      origin: 'PER',
      destination: 'DPS',
      date: new Date(2025, 0, 5), // Jan 5 2025
    })
    expect(url).toContain('/250105/')
  })

  it('does not append associateid when env var is empty', () => {
    const url = buildSkyscannerUrl({
      origin: 'PER',
      destination: 'MEL',
      date: new Date(2025, 5, 15),
    })
    expect(url).not.toContain('associateid')
  })

  it('builds a round-trip URL when returnDate is provided', () => {
    const url = buildSkyscannerUrl({
      origin: 'PER',
      destination: 'DPS',
      date: new Date(2026, 5, 14),    // Jun 14 2026
      returnDate: new Date(2026, 5, 20), // Jun 20 2026
    })
    expect(url).toBe(
      'https://www.skyscanner.com.au/transport/flights/PER/DPS/260614/260620/?adultsv2=1'
    )
  })

  it('returns a one-way URL when returnDate is undefined', () => {
    const url = buildSkyscannerUrl({
      origin: 'PER',
      destination: 'SYD',
      date: new Date(2026, 5, 14),
      returnDate: undefined,
    })
    expect(url).toContain('/PER/SYD/260614/?')
    // One-way URL has exactly one 6-digit date segment, not two
    expect(url).not.toMatch(/\/\d{6}\/\d{6}\//)
  })
})

describe('buildBookingUrl', () => {
  it('builds the correct base URL', () => {
    const url = buildBookingUrl({
      destination: 'Bali',
      checkin: new Date(2025, 5, 15),
      checkout: new Date(2025, 5, 21),
    })
    expect(url).toContain('https://www.booking.com/searchresults.html')
    expect(url).toContain('ss=Bali')
    expect(url).toContain('checkin=2025-06-15')
    expect(url).toContain('checkout=2025-06-21')
  })

  it('URL-encodes destination with spaces', () => {
    const url = buildBookingUrl({
      destination: 'Gold Coast',
      checkin: new Date(2025, 5, 15),
      checkout: new Date(2025, 5, 21),
    })
    expect(url).toContain('ss=Gold%20Coast')
  })

  it('uses local date (not UTC) to avoid timezone shift', () => {
    // New Date(2025, 0, 1) is midnight local — toISOString would shift it for UTC+ zones
    const url = buildBookingUrl({
      destination: 'Sydney',
      checkin: new Date(2025, 0, 1),
      checkout: new Date(2025, 0, 7),
    })
    expect(url).toContain('checkin=2025-01-01')
    expect(url).toContain('checkout=2025-01-07')
  })

  it('does not append aid when env var is empty', () => {
    const url = buildBookingUrl({
      destination: 'Bali',
      checkin: new Date(2025, 5, 15),
      checkout: new Date(2025, 5, 21),
    })
    expect(url).not.toContain('aid=')
  })
})
