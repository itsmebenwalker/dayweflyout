import { render, screen } from '@testing-library/react'
import PasswordRules from '@/components/ui/PasswordRules'

describe('PasswordRules', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordRules password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows all four rules when a password is typed', () => {
    render(<PasswordRules password="a" />)
    expect(screen.getByText('12 or more characters')).toBeInTheDocument()
    expect(screen.getByText('Uppercase letter')).toBeInTheDocument()
    expect(screen.getByText('Lowercase letter')).toBeInTheDocument()
    expect(screen.getByText('At least one number')).toBeInTheDocument()
  })

  it('marks length rule met when password >= 12 characters', () => {
    render(<PasswordRules password="abcdefghijkl" />)
    const item = screen.getByText('12 or more characters').closest('li')
    expect(item).toHaveClass('text-emerald-400')
  })

  it('marks uppercase rule met when password contains uppercase', () => {
    render(<PasswordRules password="A" />)
    const item = screen.getByText('Uppercase letter').closest('li')
    expect(item).toHaveClass('text-emerald-400')
  })

  it('marks lowercase rule met when password contains lowercase', () => {
    render(<PasswordRules password="a" />)
    const item = screen.getByText('Lowercase letter').closest('li')
    expect(item).toHaveClass('text-emerald-400')
  })

  it('marks number rule met when password contains a digit', () => {
    render(<PasswordRules password="1" />)
    const item = screen.getByText('At least one number').closest('li')
    expect(item).toHaveClass('text-emerald-400')
  })

  it('marks all rules met for a fully valid password', () => {
    render(<PasswordRules password="ValidPass1Abc" />)
    for (const label of ['12 or more characters', 'Uppercase letter', 'Lowercase letter', 'At least one number']) {
      expect(screen.getByText(label).closest('li')).toHaveClass('text-emerald-400')
    }
  })

  it('leaves unmet rules in muted style', () => {
    render(<PasswordRules password="abc" />)
    // Only lowercase is met; others are unmet
    expect(screen.getByText('12 or more characters').closest('li')).toHaveClass('text-slate-500')
    expect(screen.getByText('Uppercase letter').closest('li')).toHaveClass('text-slate-500')
    expect(screen.getByText('At least one number').closest('li')).toHaveClass('text-slate-500')
  })
})
