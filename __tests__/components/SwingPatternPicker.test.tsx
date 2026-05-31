import { render, screen, fireEvent } from '@testing-library/react'
import SwingPatternPicker from '@/components/roster/SwingPatternPicker'

const defaults = {
  daysOn: 14,
  daysOff: 7,
  cycleStartDate: '2025-06-15',
  onChange: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

describe('SwingPatternPicker', () => {
  it('renders the current days on and off values', () => {
    render(<SwingPatternPicker {...defaults} />)
    expect(screen.getAllByText('14').length).toBeGreaterThan(0)
    expect(screen.getAllByText('7').length).toBeGreaterThan(0)
  })

  it('renders days on and days off labels', () => {
    render(<SwingPatternPicker {...defaults} />)
    expect(screen.getByText('Days on')).toBeInTheDocument()
    expect(screen.getByText('Days off')).toBeInTheDocument()
  })

  it('calls onChange with incremented daysOn', () => {
    render(<SwingPatternPicker {...defaults} />)
    fireEvent.click(screen.getAllByLabelText('Increase')[0])
    expect(defaults.onChange).toHaveBeenCalledWith({
      daysOn: 15,
      daysOff: 7,
      cycleStartDate: '2025-06-15',
    })
  })

  it('calls onChange with decremented daysOn', () => {
    render(<SwingPatternPicker {...defaults} />)
    fireEvent.click(screen.getAllByLabelText('Decrease')[0])
    expect(defaults.onChange).toHaveBeenCalledWith({
      daysOn: 13,
      daysOff: 7,
      cycleStartDate: '2025-06-15',
    })
  })

  it('calls onChange with incremented daysOff', () => {
    render(<SwingPatternPicker {...defaults} />)
    fireEvent.click(screen.getAllByLabelText('Increase')[1])
    expect(defaults.onChange).toHaveBeenCalledWith({
      daysOn: 14,
      daysOff: 8,
      cycleStartDate: '2025-06-15',
    })
  })

  it('disables the Decrease button when daysOn is at minimum (1)', () => {
    render(<SwingPatternPicker {...defaults} daysOn={1} />)
    expect(screen.getAllByLabelText('Decrease')[0]).toBeDisabled()
  })

  it('disables the Increase button when daysOn is at maximum (60)', () => {
    render(<SwingPatternPicker {...defaults} daysOn={60} />)
    expect(screen.getAllByLabelText('Increase')[0]).toBeDisabled()
  })

  it('renders the cycle preview', () => {
    render(<SwingPatternPicker {...defaults} />)
    expect(screen.getByText('Next 4 cycles')).toBeInTheDocument()
  })

  it('renders the cycle start date input', () => {
    render(<SwingPatternPicker {...defaults} />)
    const input = screen.getByDisplayValue('2025-06-15')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'date')
  })
})
