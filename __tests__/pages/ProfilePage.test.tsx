import { render, screen, fireEvent } from '@testing-library/react'
import ProfilePage from '@/app/(app)/profile/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'ben@example.com' } },
      }),
      updateUser: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({}),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { full_name: 'Ben Walker', home_airport: 'PER' },
      }),
      then: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

describe('ProfilePage', () => {
  it('renders the change password toggle', async () => {
    render(<ProfilePage />)
    expect(await screen.findByText(/change password/i)).toBeInTheDocument()
  })

  it('expands the password section when the toggle is clicked', async () => {
    render(<ProfilePage />)
    fireEvent.click(await screen.findByText(/change password/i))
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
  })

  it('shows error when password is too short', async () => {
    render(<ProfilePage />)
    fireEvent.click(await screen.findByText(/change password/i))
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Short1A' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Short1A' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/at least 12 characters/i)).toBeInTheDocument()
  })

  it('shows error when password has no uppercase', async () => {
    render(<ProfilePage />)
    fireEvent.click(await screen.findByText(/change password/i))
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'alllower1234' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'alllower1234' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/uppercase and lowercase/i)).toBeInTheDocument()
  })

  it('shows error when password has no number', async () => {
    render(<ProfilePage />)
    fireEvent.click(await screen.findByText(/change password/i))
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NoNumbersAtAllHere' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NoNumbersAtAllHere' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/at least one number/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<ProfilePage />)
    fireEvent.click(await screen.findByText(/change password/i))
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'ValidPass1Aa' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'DifferentPass1Aa' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('renders save changes and sign out buttons', async () => {
    render(<ProfilePage />)
    expect(await screen.findByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
