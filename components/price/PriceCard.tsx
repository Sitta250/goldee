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
    <article className="rounded-card bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden">
      {/* Top accent line */}
      <div className={`h-0.5 w-full ${isBuy ? 'bg-gold-400' : 'bg-gray-200'}`} />

      <div className="p-4 flex flex-col gap-3">
        {/* Label + type badge */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400">{sublabel}</p>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            isBuy
              ? 'bg-gold-50 text-gold-700'
              : 'bg-gray-50 text-gray-500'
          }`}>
            {isBuy ? 'ซื้อ' : 'ขาย'}
          </span>
        </div>

        {/* Price */}
        <p
          className="text-price-md font-bold text-gray-900 leading-none tabular-nums"
          aria-label={`${label} ${symbol}${format(value)} ${isUsd ? 'USD' : 'บาท'}`}
        >
          <span className="text-sm font-normal text-gray-400 mr-0.5">{symbol}</span>
          {format(value)}
        </p>
      </div>
    </article>
  )
}
