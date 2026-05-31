'use client'

import { HardHat, Coffee, CalendarDays } from 'lucide-react'

interface SwingValues {
  daysOn: number
  daysOff: number
  cycleStartDate: string
}

interface Props extends SwingValues {
  onChange: (values: SwingValues) => void
}

function Stepper({
  value,
  min = 1,
  max = 60,
  onChange,
}: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
        className="w-9 h-9 rounded-xl bg-slate-700 text-white text-lg font-bold hover:bg-slate-600 active:bg-slate-500 transition-colors disabled:opacity-40"
        disabled={value <= min}
      >
        −
      </button>
      <span className="w-8 text-center text-white font-semibold text-lg tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase"
        className="w-9 h-9 rounded-xl bg-slate-700 text-white text-lg font-bold hover:bg-slate-600 active:bg-slate-500 transition-colors disabled:opacity-40"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}

function CyclePreview({ daysOn, daysOff }: { daysOn: number; daysOff: number }) {
  const cycleCount = 4
  const total = (daysOn + daysOff) * cycleCount
  const blocks = Array.from({ length: cycleCount }, (_, i) => [
    { type: 'work' as const, days: daysOn, pct: (daysOn / total) * 100 },
    { type: 'off' as const, days: daysOff, pct: (daysOff / total) * 100 },
  ]).flat()

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">Next 4 cycles</p>
      <div className="flex w-full h-8 rounded-xl overflow-hidden gap-px">
        {blocks.map((block, i) => (
          <div
            key={i}
            style={{ width: `${block.pct}%` }}
            className={`flex items-center justify-center text-xs font-semibold overflow-hidden ${
              block.type === 'work'
                ? 'bg-slate-700 text-slate-400'
                : 'bg-sky-400 text-slate-900'
            }`}
          >
            {block.pct > 6 ? `${block.days}d` : ''}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
          {daysOff}d off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-700 inline-block" />
          {daysOn}d work
        </span>
      </div>
    </div>
  )
}

export default function SwingPatternPicker({
  daysOn,
  daysOff,
  cycleStartDate,
  onChange,
}: Props) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 space-y-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <HardHat size={16} className="text-slate-400" />
          Days on
        </span>
        <Stepper
          value={daysOn}
          onChange={(v) => onChange({ daysOn: v, daysOff, cycleStartDate })}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <Coffee size={16} className="text-sky-400" />
          Days off
        </span>
        <Stepper
          value={daysOff}
          onChange={(v) => onChange({ daysOn, daysOff: v, cycleStartDate })}
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <CalendarDays size={16} className="text-slate-400" />
          My next swing starts on
        </label>
        <input
          type="date"
          value={cycleStartDate}
          onChange={(e) => onChange({ daysOn, daysOff, cycleStartDate: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-400 transition-colors"
        />
      </div>

      <CyclePreview daysOn={daysOn} daysOff={daysOff} />
    </div>
  )
}
