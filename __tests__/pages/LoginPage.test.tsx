import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}))

describe('LoginPage', () => {
  it('renders the sign-in heading', () => {
    render(<LoginPage />)
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders a link to the sign up page', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })

  it('renders the app name', () => {
    render(<LoginPage />)
    expect(screen.getByText('DayWeFlyOut')).toBeInTheDocument()
  })
})
