'use client'

import Link        from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { UI, s }       from '@/lib/i18n/ui-strings'

const NAV_ITEMS = [
  { href: '/',            labelObj: UI.nav.home       },
  { href: '/history',    labelObj: UI.nav.history    },
  { href: '/calculator', labelObj: UI.nav.calculator },
  { href: '/articles',   labelObj: UI.nav.articles   },
  { href: '/about',      labelObj: UI.nav.about      },
]

export function NavLinks() {
  const { lang } = useLanguage()

  return (
    <nav aria-label={lang === 'th' ? 'เมนูหลัก' : 'Main navigation'} className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map(({ href, labelObj }) => (
        <Link
          key={href}
          href={href}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          {s(labelObj, lang)}
        </Link>
      ))}
    </nav>
  )
}
