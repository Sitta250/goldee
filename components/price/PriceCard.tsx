'use client'

import { useCurrency } from '@/contexts/CurrencyContext'

interface PriceCardProps {
  label: string
  sublabel: string
  value: number
  type: 'buy' | 'sell'
}

export function PriceCard({ label, sublabel, value, type }: PriceCardProps) {
  const { isUsd, symbol, format } = useCurrency()
  const isBuy = type === 'buy'

  return (
    <article className={`rounded-card bg-white border shadow-card p-4 flex flex-col gap-2 ${
      isBuy ? 'border-orange-100' : 'border-blue-100'
    }`}>
      {/* Label + type badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-800">
            {label}
          </p>
          <p className="text-xs text-gray-400">{sublabel}</p>
        </div>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
          isBuy
            ? 'bg-orange-100 text-orange-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {isBuy ? 'ซื้อ' : 'ขาย'}
        </span>
      </div>

      {/* Price */}
      <p
        className="text-price-md font-bold text-gray-900 leading-none tabular-nums"
        aria-label={`${label} ${symbol}${format(value)} ${isUsd ? 'USD' : 'บาท'}`}
      >
        <span className="text-sm font-medium text-gray-500 mr-0.5">{symbol}</span>
        {format(value)}
      </p>
    </article>
  )
}
