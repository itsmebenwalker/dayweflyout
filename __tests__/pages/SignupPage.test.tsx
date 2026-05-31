import { render, screen, fireEvent } from '@testing-library/react'
import SignupPage from '@/app/(auth)/signup/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test' }, session: null },
        error: null,
      }),
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

  it('shows validation error for short password', async () => {
    render(<SignupPage />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Short1' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!)
    expect(await screen.findByText(/at least 12 characters/i)).toBeInTheDocument()
  })

  it('shows validation error for missing uppercase', async () => {
    render(<SignupPage />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'alllowercase123' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!)
    expect(await screen.findByText(/uppercase and lowercase/i)).toBeInTheDocument()
  })

  it('shows validation error for missing number', async () => {
    render(<SignupPage />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'NoNumbersHereAtAll' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!)
    expect(await screen.findByText(/at least one number/i)).toBeInTheDocument()
  })
})
