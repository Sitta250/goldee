'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { HistoryTimeframe } from '@/lib/queries/history'
import { useHistoryLoading } from './HistoryLoadingContext'

const TIMEFRAMES: { value: HistoryTimeframe; label: string }[] = [
  { value: '7D',  label: '7 วัน' },
  { value: '30D', label: '30 วัน' },
  { value: '6M',  label: '6 เดือน' },
  { value: '1Y',  label: '1 ปี' },
]

interface HistoryTimeframeNavProps {
  active: HistoryTimeframe
}

export function HistoryTimeframeNav({ active }: HistoryTimeframeNavProps) {
  const [pending, setPending] = useState<HistoryTimeframe | null>(null)
  const { setLoading } = useHistoryLoading()

  // When the server delivers new data (active prop changes), clear all pending state
  useEffect(() => {
    setPending(null)
    setLoading(false)
  }, [active, setLoading])

  const displayActive = pending ?? active

  function handleClick(value: HistoryTimeframe) {
    if (value === displayActive) return   // already selected, no-op
    setPending(value)
    setLoading(true)
  }

  return (
    <nav role="group" aria-label="เลือกช่วงเวลา" className="flex flex-wrap gap-1.5">
      {TIMEFRAMES.map(({ value, label }) => {
        const isActive = displayActive === value
        return (
          <Link
            key={value}
            href={`/history?range=${value}`}
            scroll={false}
            onClick={() => handleClick(value)}
            aria-current={isActive ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-gold-500 text-white shadow-sm pointer-events-none'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
