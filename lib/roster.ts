import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns'
import type { DayType, DayWindow, Roster } from './types'

export function buildDayMap(
  roster: Roster,
  from: Date,
  to: Date
): Map<string, DayType> {
  const map = new Map<string, DayType>()
  const start = startOfDay(from)
  const end = startOfDay(to)

  if (roster.pattern_type === 'swing') {
    const { days_on, days_off, cycle_start_date } = roster
    if (!days_on || !days_off || !cycle_start_date) return map

    const cycleLength = days_on + days_off
    const origin = startOfDay(parseISO(cycle_start_date))

    let d = new Date(start)
    while (d <= end) {
      const diff = differenceInDays(d, origin)
      const pos = ((diff % cycleLength) + cycleLength) % cycleLength
      map.set(format(d, 'yyyy-MM-dd'), pos < days_on ? 'work' : 'off')
      d = addDays(d, 1)
    }
  } else if (roster.pattern_type === 'manual' && roster.manual_days) {
    for (const { date, type } of roster.manual_days) {
      const d = startOfDay(parseISO(date))
      if (d >= start && d <= end) {
        map.set(date, type)
      }
    }
  }

  return map
}

export function getOffWindows(
  roster: Roster,
  minNights = 2,
  referenceDate?: Date
): DayWindow[] {
  const today = startOfDay(referenceDate ?? new Date())
  const horizon = addDays(today, 180)

  const dayMap = buildDayMap(roster, today, horizon)
  const windows: DayWindow[] = []

  let winStart: Date | null = null
  let winEnd: Date | null = null

  let d = new Date(today)
  while (d <= horizon) {
    const key = format(d, 'yyyy-MM-dd')
    const isOff = dayMap.get(key) === 'off'

    if (isOff) {
      if (!winStart) winStart = new Date(d)
      winEnd = new Date(d)
    } else if (winStart && winEnd) {
      const nights = differenceInDays(winEnd, winStart) + 1
      if (nights >= minNights) {
        windows.push({ start: winStart, end: winEnd, durationNights: nights })
      }
      winStart = null
      winEnd = null
    }

    d = addDays(d, 1)
  }

  if (winStart && winEnd) {
    const nights = differenceInDays(winEnd, winStart) + 1
    if (nights >= minNights) {
      windows.push({ start: winStart, end: winEnd, durationNights: nights })
    }
  }

  return windows
}
