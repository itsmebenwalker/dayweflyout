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
