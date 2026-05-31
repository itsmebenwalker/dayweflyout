import { render, screen } from '@testing-library/react'
import FlightCard from '@/components/deals/FlightCard'
import type { Flight } from '@/lib/types'

const mockFlight: Flight = {
  price: 299,
  duration_minutes: 240,
  stops: 0,
  legs: [
    {
      airline: 'Qantas',
      flight_number: 'QF123',
      departure: '2025-06-15T07:00:00',
      arrival: '2025-06-15T11:00:00',
      from: 'PER',
      to: 'SYD',
    },
  ],
}

describe('FlightCard', () => {
  it('renders the price', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText(/299/)).toBeInTheDocument()
  })

  it('renders origin and destination IATA codes', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('PER')).toBeInTheDocument()
    expect(screen.getByText('SYD')).toBeInTheDocument()
  })

  it('shows "Direct" for 0 stops', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('Direct')).toBeInTheDocument()
  })

  it('shows stop count for multi-stop flights', () => {
    const multiStop = { ...mockFlight, stops: 2 }
    render(<FlightCard flight={multiStop} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('2 stops')).toBeInTheDocument()
  })

  it('shows "1 stop" (singular) for single-stop flights', () => {
    const oneStop = { ...mockFlight, stops: 1 }
    render(<FlightCard flight={oneStop} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('1 stop')).toBeInTheDocument()
  })

  it('formats duration correctly', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('4h 0m')).toBeInTheDocument()
  })

  it('renders the airline name', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('Qantas')).toBeInTheDocument()
  })

  it('renders a Book Flight link pointing to the bookUrl', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com/test" />)
    const link = screen.getByRole('link', { name: /book flight/i })
    expect(link).toHaveAttribute('href', 'https://skyscanner.com/test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

const roundTripFlight: Flight = {
  price: 450,
  duration_minutes: 460,
  stops: 0,
  legs: [
    {
      airline: 'AirAsia',
      flight_number: 'AK77',
      departure: '2026-06-14T20:00:00',
      arrival: '2026-06-14T23:40:00',
      from: 'PER',
      to: 'DPS',
    },
    {
      airline: 'AirAsia',
      flight_number: 'AK78',
      departure: '2026-06-20T09:00:00',
      arrival: '2026-06-20T12:40:00',
      from: 'DPS',
      to: 'PER',
    },
  ],
}

describe('FlightCard — round trip', () => {
  it('shows the outbound route (not PER→PER)', () => {
    render(<FlightCard flight={roundTripFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('PER')).toBeInTheDocument()
    expect(screen.getByText('DPS')).toBeInTheDocument()
    // PER should appear once in the route display, not twice
    expect(screen.queryAllByText('PER')).toHaveLength(1)
  })

  it('shows the Return badge', () => {
    render(<FlightCard flight={roundTripFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByText('Return')).toBeInTheDocument()
  })

  it('renders "Book Return Flight" CTA', () => {
    render(<FlightCard flight={roundTripFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.getByRole('link', { name: /book return flight/i })).toBeInTheDocument()
  })

  it('does not show Return badge for a one-way flight', () => {
    render(<FlightCard flight={mockFlight} bookUrl="https://skyscanner.com" />)
    expect(screen.queryByText('Return')).not.toBeInTheDocument()
  })
})
