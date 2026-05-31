/**
 * @jest-environment node
 */
import { buildDayMap, getOffWindows } from '@/lib/roster'
import type { Roster } from '@/lib/types'

// Jan 1 2025 in local time (avoids UTC-midnight edge cases)
const REF = new Date(2025, 0, 1)

describe('buildDayMap', () => {
  it('maps work and off days for a swing pattern', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'swing',
      days_on: 14,
      days_off: 7,
      cycle_start_date: '2025-01-01',
      manual_days: null,
    }
    const map = buildDayMap(roster, REF, new Date(2025, 0, 21))
    expect(map.get('2025-01-01')).toBe('work')   // day 0 — work
    expect(map.get('2025-01-14')).toBe('work')   // day 13 — still work
    expect(map.get('2025-01-15')).toBe('off')    // day 14 — first off day
    expect(map.get('2025-01-21')).toBe('off')    // day 20 — last off day of first window
  })

  it('wraps correctly for cycles starting before the from date', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'swing',
      days_on: 7,
      days_off: 7,
      cycle_start_date: '2024-01-01',
      manual_days: null,
    }
    const map = buildDayMap(roster, REF, new Date(2025, 0, 14))
    const values = Array.from(map.values())
    expect(values).toContain('work')
    expect(values).toContain('off')
  })

  it('only includes manual days within the from/to range', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'manual',
      days_on: null,
      days_off: null,
      cycle_start_date: null,
      manual_days: [
        { date: '2024-12-31', type: 'off' }, // before range
        { date: '2025-01-05', type: 'off' }, // in range
      ],
    }
    const map = buildDayMap(roster, REF, new Date(2025, 0, 10))
    expect(map.get('2024-12-31')).toBeUndefined()
    expect(map.get('2025-01-05')).toBe('off')
  })
})

describe('getOffWindows', () => {
  it('returns correct off windows for a swing pattern', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'swing',
      days_on: 14,
      days_off: 7,
      cycle_start_date: '2025-01-01',
      manual_days: null,
    }
    const windows = getOffWindows(roster, 2, REF)
    expect(windows.length).toBeGreaterThan(0)
    // First off window: Jan 15–21
    expect(windows[0].start.getDate()).toBe(15)
    expect(windows[0].start.getMonth()).toBe(0)
    expect(windows[0].durationNights).toBe(7)
  })

  it('filters windows shorter than minNights', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'swing',
      days_on: 14,
      days_off: 1,
      cycle_start_date: '2025-01-01',
      manual_days: null,
    }
    expect(getOffWindows(roster, 2, REF)).toHaveLength(0)
  })

  it('handles cycles that started well in the past', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'swing',
      days_on: 7,
      days_off: 7,
      cycle_start_date: '2024-01-01',
      manual_days: null,
    }
    const windows = getOffWindows(roster, 2, REF)
    expect(windows.length).toBeGreaterThan(0)
    windows.forEach((w) => expect(w.durationNights).toBe(7))
  })

  it('returns windows from manual pattern', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'manual',
      days_on: null,
      days_off: null,
      cycle_start_date: null,
      manual_days: [
        { date: '2025-01-05', type: 'off' },
        { date: '2025-01-06', type: 'off' },
        { date: '2025-01-07', type: 'off' },
        { date: '2025-01-10', type: 'off' }, // single day — filtered by minNights=2
      ],
    }
    const windows = getOffWindows(roster, 2, REF)
    expect(windows).toHaveLength(1)
    expect(windows[0].durationNights).toBe(3)
  })

  it('returns empty array for incomplete swing config', () => {
    const roster: Roster = {
      label: 'Test',
      pattern_type: 'swing',
      days_on: null,
      days_off: null,
      cycle_start_date: null,
      manual_days: null,
    }
    expect(getOffWindows(roster, 2, REF)).toHaveLength(0)
  })
})
