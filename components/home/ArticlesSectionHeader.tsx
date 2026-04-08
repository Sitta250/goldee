'use client'

import Link from 'next/link'
import { useLanguage }   from '@/contexts/LanguageContext'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { UI, s }          from '@/lib/i18n/ui-strings'

export function ArticlesSectionHeader() {
  const { lang } = useLanguage()

  return (
    <SectionHeading
      title={s(UI.homepage.articlesHeading, lang)}
      subtitle={s(UI.homepage.articlesSubtitle, lang)}
      className="mb-5"
      action={
        <Link
          href="/articles"
          className="text-sm text-gold-600 hover:underline font-medium"
        >
          {s(UI.homepage.viewAll, lang)}
        </Link>
      }
    />
  )
}
