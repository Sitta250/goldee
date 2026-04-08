'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { UI, s }       from '@/lib/i18n/ui-strings'
import type { FaqItemDisplay } from '@/types/faq'

interface FaqSectionProps {
  items: FaqItemDisplay[]
}

export function FaqSection({ items }: FaqSectionProps) {
  const { lang } = useLanguage()

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <h2 id="faq-heading" className="text-xl font-semibold text-gray-900">
        {s(UI.homepage.faqHeading, lang)}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">
          {s(UI.homepage.faqEmpty, lang)}
        </p>
      ) : (
        <dl className="space-y-2">
          {items.map((item) => (
            <details
              key={item.id}
              className="group rounded-card bg-white border border-gray-100 shadow-card overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none text-gray-900 font-medium text-sm hover:bg-gray-50 transition-colors">
                <dt>{item.question}</dt>
                <span
                  className="shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200"
                  aria-hidden="true"
                >
                  ▾
                </span>
              </summary>
              <dd className="px-5 pb-4 pt-0 text-sm text-gray-600 leading-[1.8] border-t border-gray-50">
                {item.answer}
              </dd>
            </details>
          ))}
        </dl>
      )}
    </section>
  )
}
