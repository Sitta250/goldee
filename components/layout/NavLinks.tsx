'use client'

import Link             from 'next/link'
import { usePathname }  from 'next/navigation'
import { useLanguage }  from '@/contexts/LanguageContext'
import { UI, s }        from '@/lib/i18n/ui-strings'

const NAV_ITEMS = [
  { href: '/',            labelObj: UI.nav.home       },
  { href: '/history',    labelObj: UI.nav.history    },
  { href: '/calculator', labelObj: UI.nav.calculator },
  { href: '/articles',   labelObj: UI.nav.articles   },
  { href: '/about',      labelObj: UI.nav.about      },
]

export function NavLinks() {
  const { lang } = useLanguage()
  const pathname  = usePathname()

  return (
    <nav aria-label={lang === 'th' ? 'เมนูหลัก' : 'Main navigation'} className="hidden md:flex items-center gap-0.5">
      {NAV_ITEMS.map(({ href, labelObj }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {s(labelObj, lang)}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gold-400" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
