import { render, screen, fireEvent } from '@testing-library/react'
import RosterCalendar from '@/components/roster/RosterCalendar'
import { format, addMonths } from 'date-fns'

const onChange = jest.fn()
beforeEach(() => jest.clearAllMocks())

describe('RosterCalendar', () => {
  it('renders the current month and year', () => {
    render(<RosterCalendar manualDays={[]} onChange={onChange} />)
    const expected = format(new Date(), 'MMMM yyyy')
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders all day-of-week headers', () => {
    render(<RosterCalendar manualDays={[]} onChange={onChange} />)
    // Mon-first single-letter headers — 7 cells
    const headers = screen.getAllByText(/^[MTWFS]$/)
    expect(headers).toHaveLength(7)
  })

  it('navigates to the next month', () => {
    render(<RosterCalendar manualDays={[]} onChange={onChange} />)
    const nextMonth = format(addMonths(new Date(), 1), 'MMMM yyyy')
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(screen.getByText(nextMonth)).toBeInTheDocument()
  })

  it('navigates back to the previous month', () => {
    render(<RosterCalendar manualDays={[]} onChange={onChange} />)
    const current = format(new Date(), 'MMMM yyyy')
    fireEvent.click(screen.getByLabelText('Next month'))
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(screen.getByText(current)).toBeInTheDocument()
  })

  it('renders prev/next navigation buttons', () => {
    render(<RosterCalendar manualDays={[]} onChange={onChange} />)
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument()
    expect(screen.getByLabelText('Next month')).toBeInTheDocument()
  })

  it('renders the work/off legend', () => {
    render(<RosterCalendar manualDays={[]} onChange={onChange} />)
    expect(screen.getByText('Days off')).toBeInTheDocument()
    expect(screen.getByText('On swing')).toBeInTheDocument()
  })
})
