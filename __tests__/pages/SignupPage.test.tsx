import { render, screen } from '@testing-library/react'
import SignupPage from '@/app/(auth)/signup/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}))

describe('SignupPage', () => {
  it('renders the create account heading', () => {
    render(<SignupPage />)
    expect(screen.getByText(/create your account/i)).toBeInTheDocument()
  })

  it('renders full name, email, and password inputs', () => {
    render(<SignupPage />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the create account button', () => {
    render(<SignupPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders a link back to sign in', () => {
    render(<SignupPage />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })
})
