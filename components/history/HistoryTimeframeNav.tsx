import Link from 'next/link'
import type { HistoryTimeframe } from '@/lib/queries/history'

const TIMEFRAMES: { value: HistoryTimeframe; label: string }[] = [
  { value: '7D',  label: '7 วัน' },
  { value: '30D', label: '30 วัน' },
  { value: '6M',  label: '6 เดือน' },
  { value: '1Y',  label: '1 ปี' },
  { value: 'All', label: 'ทั้งหมด' },
]

interface HistoryTimeframeNavProps {
  active: HistoryTimeframe
}

/**
 * Timeframe selector for the history page.
 * Each button is a plain <Link> — clicking navigates to /history?range=X
 * which triggers a full server-side re-render with the correct data.
 * No client-side fetch needed.
 */
export function HistoryTimeframeNav({ active }: HistoryTimeframeNavProps) {
  return (
    <nav role="group" aria-label="เลือกช่วงเวลา" className="flex flex-wrap gap-1.5">
      {TIMEFRAMES.map(({ value, label }) => {
        const isActive = active === value
        return (
          <Link
            key={value}
            href={`/history?range=${value}`}
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
