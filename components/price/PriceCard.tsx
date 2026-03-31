import { formatPrice } from '@/lib/utils/format'

interface PriceCardProps {
  label: string
  sublabel: string
  value: number
  type: 'buy' | 'sell'
}

export function PriceCard({ label, sublabel, value, type }: PriceCardProps) {
  const isBuy = type === 'buy'

  return (
    <article className="rounded-card bg-white border border-gray-100 shadow-card p-4 flex flex-col gap-2">
      {/* Label */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>

      {/* Price */}
      <p
        className="text-price-md font-bold text-gray-900 leading-none tabular-nums"
        aria-label={`${label} ${formatPrice(value)} บาท`}
      >
        {formatPrice(value)}
      </p>

      {/* Type indicator */}
      <p
        className={`text-xs font-medium ${
          isBuy ? 'text-orange-600' : 'text-blue-600'
        }`}
      >
        {isBuy ? 'ราคารับซื้อ' : 'ราคาขายออก'}
      </p>
    </article>
  )
}
