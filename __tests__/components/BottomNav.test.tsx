import { render, screen } from '@testing-library/react'
import BottomNav from '@/components/nav/BottomNav'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}))

describe('BottomNav', () => {
  it('renders all four navigation tabs', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /find/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /saved/i })).toBeInTheDocument()
  })

  it('links to the correct routes', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /find/i })).toHaveAttribute('href', '/search')
    expect(screen.getByRole('link', { name: /roster/i })).toHaveAttribute('href', '/roster')
    expect(screen.getByRole('link', { name: /saved/i })).toHaveAttribute('href', '/saved')
  })
})
