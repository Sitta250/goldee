import type { PriceChange } from '@/types/gold'
import type { ArticleCategory } from '@/types/article'
import { ARTICLE_CATEGORY_LABELS } from '@/types/article'
import { formatPrice } from '@/lib/utils/format'

// ─── Price direction badge ─────────────────────────────────────────────────────

interface DirectionBadgeProps {
  direction: PriceChange['direction']
  className?: string
}

export function DirectionBadge({ direction, className = '' }: DirectionBadgeProps) {
  if (direction === 'up') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold bg-green-100 text-green-700 ${className}`}
        aria-label="ราคาขึ้น"
      >
        ▲ ขึ้น
      </span>
    )
  }
  if (direction === 'down') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold bg-red-100 text-red-700 ${className}`}
        aria-label="ราคาลง"
      >
        ▼ ลง
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold bg-gray-100 text-gray-500 ${className}`}
      aria-label="ราคาคงที่"
    >
      — คงที่
    </span>
  )
}

// ─── Price change badge — shows delta amount + percent in one pill ────────────
// Use this wherever you want to communicate magnitude alongside direction.

interface PriceChangeBadgeProps {
  delta:    number   // absolute change in THB (positive = up, negative = down)
  percent:  number   // percentage change (same sign as delta)
  className?: string
}

export function PriceChangeBadge({ delta, percent, className = '' }: PriceChangeBadgeProps) {
  const isUp   = delta > 0
  const isDown = delta < 0

  const colorCls = isUp
    ? 'bg-green-50 text-green-700 ring-green-200'
    : isDown
      ? 'bg-red-50 text-red-700 ring-red-200'
      : 'bg-gray-50 text-gray-500 ring-gray-200'

  const arrow = isUp ? '▲' : isDown ? '▼' : '—'
  const sign  = isUp ? '+' : isDown ? '−' : ''
  const dirLabel = isUp ? 'ขึ้น' : isDown ? 'ลง' : 'คงที่'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset tabular-nums ${colorCls} ${className}`}
      aria-label={`ราคา${dirLabel} ${formatPrice(Math.abs(delta))} บาท (${Math.abs(percent).toFixed(2)}%)`}
    >
      <span aria-hidden="true">{arrow}</span>
      <span>{sign}{formatPrice(Math.abs(delta))}</span>
      <span className="opacity-70">({sign}{Math.abs(percent).toFixed(2)}%)</span>
    </span>
  )
}

// ─── Article category badge ────────────────────────────────────────────────────

interface CategoryBadgeProps {
  category: ArticleCategory
  className?: string
}

const categoryStyles: Record<ArticleCategory, string> = {
  news:      'bg-blue-100 text-blue-700',
  guide:     'bg-amber-100 text-amber-700',
  explainer: 'bg-purple-100 text-purple-700',
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[category]} ${className}`}
    >
      {ARTICLE_CATEGORY_LABELS[category]}
    </span>
  )
}
