import type { PriceChange } from '@/types/gold'
import type { ArticleCategory } from '@/types/article'
import { ARTICLE_CATEGORY_LABELS } from '@/types/article'

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
