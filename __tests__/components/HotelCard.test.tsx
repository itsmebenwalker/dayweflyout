import { render, screen } from '@testing-library/react'
import HotelCard from '@/components/deals/HotelCard'

const props = {
  destination: 'Bali',
  checkin: new Date(2025, 5, 15),
  checkout: new Date(2025, 5, 21),
  nights: 6,
  bookUrl: 'https://booking.com/test',
}

describe('HotelCard', () => {
  it('renders the destination', () => {
    render(<HotelCard {...props} />)
    expect(screen.getByText('Bali')).toBeInTheDocument()
  })

  it('renders the nights count', () => {
    render(<HotelCard {...props} />)
    expect(screen.getByText('6 nights')).toBeInTheDocument()
  })

  it('renders the check-in and check-out dates', () => {
    render(<HotelCard {...props} />)
    expect(screen.getByText(/15 Jun/)).toBeInTheDocument()
    expect(screen.getByText(/21 Jun/)).toBeInTheDocument()
  })

  it('renders a Find Hotels link pointing to the bookUrl', () => {
    render(<HotelCard {...props} />)
    const link = screen.getByRole('link', { name: /find hotels/i })
    expect(link).toHaveAttribute('href', 'https://booking.com/test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows the Booking.com pricing disclaimer', () => {
    render(<HotelCard {...props} />)
    expect(screen.getByText(/prices shown on booking\.com/i)).toBeInTheDocument()
  })
})
