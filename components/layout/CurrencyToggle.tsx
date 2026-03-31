'use client'

import { useCurrency } from '@/contexts/CurrencyContext'

/**
 * CurrencyToggle — compact pill button in the header.
 * Shows "฿ THB" or "$ USD" with the active currency highlighted.
 * Hides itself when no exchange rate is available (rate is null).
 */
export function CurrencyToggle() {
  const { isUsd, rate, toggle } = useCurrency()

  // Don't render if we have no rate to convert with
  if (rate == null) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isUsd ? 'เปลี่ยนเป็นบาทไทย' : 'Switch to USD'}
      aria-pressed={isUsd}
      className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:border-gold-400 hover:bg-gold-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      <span className={isUsd ? 'text-gray-400' : 'text-gold-600 font-semibold'}>
        ฿
      </span>
      <span className="mx-1 text-gray-300">/</span>
      <span className={isUsd ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
        $
      </span>
    </button>
  )
}
