'use client'

import type { PriceChange } from '@/types/gold'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatPercent } from '@/lib/utils/format'

interface PriceChangeProps {
  change: PriceChange
  className?: string
}

export function PriceChangeDisplay({ change, className = '' }: PriceChangeProps) {
  const { amount, percent, direction } = change
  const { symbol, format } = useCurrency()

  if (direction === 'flat') {
    return (
      <p className={`text-sm text-gray-500 ${className}`}>
        ราคาไม่เปลี่ยนแปลง
      </p>
    )
  }

  const isUp = direction === 'up'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Arrow + amount */}
      <span
        className={`flex items-center gap-1 text-base font-semibold tabular-nums ${
          isUp ? 'text-green-600' : 'text-red-600'
        }`}
        aria-label={`${isUp ? 'ขึ้น' : 'ลง'} ${symbol}${format(amount)}`}
      >
        {isUp ? '▲' : '▼'}
        {symbol}{format(amount)}
      </span>

      {/* Percentage */}
      <span
        className={`text-sm font-medium rounded-full px-2 py-0.5 ${
          isUp
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {formatPercent(percent)}
      </span>

      <span className="text-xs text-gray-400">เทียบราคาล่าสุด</span>
    </div>
  )
}
