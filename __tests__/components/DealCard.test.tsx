import { render, screen } from '@testing-library/react'
import DealCard from '@/components/deals/DealCard'

const base = {
  destination: 'Bali',
  from: new Date(2025, 5, 15),
  to: new Date(2025, 5, 21),
  href: '/find?dest=DPS',
}

describe('DealCard', () => {
  it('renders the destination name', () => {
    render(<DealCard {...base} type="flight" />)
    expect(screen.getByText('Bali')).toBeInTheDocument()
  })

  it('links to the correct href', () => {
    render(<DealCard {...base} type="flight" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/find?dest=DPS')
  })

  it('renders a price when priceFrom is provided', () => {
    render(<DealCard {...base} type="flight" priceFrom={299} />)
    expect(screen.getByText(/from A\$299/i)).toBeInTheDocument()
  })

  it('does not render a price when priceFrom is absent', () => {
    render(<DealCard {...base} type="flight" />)
    expect(screen.queryByText(/from A\$/)).not.toBeInTheDocument()
  })

  it('renders date range', () => {
    render(<DealCard {...base} type="flight" />)
    expect(screen.getByText(/15 Jun/)).toBeInTheDocument()
    expect(screen.getByText(/21 Jun/)).toBeInTheDocument()
  })
})
