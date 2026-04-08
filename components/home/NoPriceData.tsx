'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { UI, s }       from '@/lib/i18n/ui-strings'

export function NoPriceData() {
  const { lang } = useLanguage()

  return (
    <section className="rounded-card bg-white border border-gray-100 shadow-card p-10 text-center space-y-3">
      <p className="text-4xl select-none">📊</p>
      <p className="text-base font-semibold text-gray-700">
        {s(UI.homepage.noPrice, lang)}
      </p>
      <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
        {s(UI.homepage.noPriceDetail, lang)}
      </p>
    </section>
  )
}
