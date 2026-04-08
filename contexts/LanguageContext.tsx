'use client'

/**
 * LanguageContext
 *
 * Provides Thai / English language toggle to all client components.
 * Mirrors the pattern used by CurrencyContext.
 *
 * Usage:
 *   const { lang, isThai, toggle, t } = useLanguage()
 *
 * - `lang`    → 'th' | 'en'
 * - `isThai`  → boolean shorthand
 * - `toggle()` → switch between TH and EN
 * - `t(text)` → resolve an AnalysisText (or a plain string) to the active language
 */

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { AnalysisText } from '@/types/analysis'

export type Lang = 'th' | 'en'

interface LanguageContextValue {
  lang:    Lang
  isThai:  boolean
  toggle:  () => void
  /** Resolve a bilingual text object to the active language string */
  t:       (text: AnalysisText | string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('th')

  const toggle = useCallback(() =>
    setLang((l) => (l === 'th' ? 'en' : 'th')),
  [])

  const t = useCallback(
    (text: AnalysisText | string): string => {
      if (typeof text === 'string') return text
      return text[lang]
    },
    [lang],
  )

  return (
    <LanguageContext.Provider value={{ lang, isThai: lang === 'th', toggle, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
