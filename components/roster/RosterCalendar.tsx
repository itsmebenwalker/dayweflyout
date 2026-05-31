'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ManualDay } from '@/lib/types'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  manualDays: ManualDay[]
  onChange: (days: ManualDay[]) => void
}

export default function RosterCalendar({ manualDays, onChange }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const today = startOfDay(new Date())

  const offSet = useMemo(
    () => new Set(manualDays.filter((d) => d.type === 'off').map((d) => d.date)),
    [manualDays]
  )

  const { days, leadingBlanks } = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return {
      days: eachDayOfInterval({ start, end }),
      leadingBlanks: getDay(start),
    }
  }, [currentMonth])

  function toggleDay(day: Date) {
    if (isBefore(day, today)) return
    const key = format(day, 'yyyy-MM-dd')
    if (offSet.has(key)) {
      onChange(manualDays.filter((d) => d.date !== key))
    } else {
      onChange([...manualDays, { date: key, type: 'off' }])
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-400" />
        </button>
        <span className="text-white font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ChevronRight size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((label) => (
          <div key={label} className="text-center text-xs text-slate-500 font-medium py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const isOff = offSet.has(key)
          const isPast = isBefore(day, today)

          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleDay(day)}
              disabled={isPast}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                isOff
                  ? 'bg-sky-400 text-slate-900'
                  : isPast
                    ? 'text-slate-600 cursor-default'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 active:bg-slate-600'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
          Days off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-700/50 inline-block" />
          Work
        </span>
      </div>
    </div>
  )
}
