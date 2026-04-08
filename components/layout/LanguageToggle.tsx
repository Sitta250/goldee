'use client'

import { useLanguage } from '@/contexts/LanguageContext'

/**
 * LanguageToggle — compact pill button in the header.
 * Shows "TH / EN" with the active language highlighted.
 */
export function LanguageToggle() {
  const { isThai, toggle } = useLanguage()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isThai ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      aria-pressed={!isThai}
      className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:border-gold-400 hover:bg-gold-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      <span className={isThai ? 'text-gold-600 font-semibold' : 'text-gray-400'}>
        TH
      </span>
      <span className="mx-1 text-gray-300">/</span>
      <span className={isThai ? 'text-gray-400' : 'text-gold-600 font-semibold'}>
        EN
      </span>
    </button>
  )
}
