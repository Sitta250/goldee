'use client'

import type { Timeframe } from '@/types/gold'

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1D',  label: '1 วัน' },
  { value: '7D',  label: '7 วัน' },
  { value: '30D', label: '30 วัน' },
  { value: '6M',  label: '6 เดือน' },
  { value: '1Y',  label: '1 ปี' },
]

interface TimeframeSelectorProps {
  active: Timeframe
  onChange: (range: Timeframe) => void
}

export function TimeframeSelector({ active, onChange }: TimeframeSelectorProps) {
  return (
    <div role="group" aria-label="เลือกช่วงเวลา" className="flex gap-1">
      {TIMEFRAMES.map(({ value, label }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-gold-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
