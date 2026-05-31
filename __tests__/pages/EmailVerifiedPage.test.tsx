import { render, screen } from '@testing-library/react'
import EmailVerifiedPage from '@/app/(auth)/email-verified/page'

describe('EmailVerifiedPage', () => {
  it('renders the verified heading', () => {
    render(<EmailVerifiedPage />)
    expect(screen.getByText(/email verified/i)).toBeInTheDocument()
  })

  it('renders a dashboard link', () => {
    render(<EmailVerifiedPage />)
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/home')
  })

  it('renders a confirmation message', () => {
    render(<EmailVerifiedPage />)
    expect(screen.getByText(/your account is confirmed/i)).toBeInTheDocument()
  })
})
