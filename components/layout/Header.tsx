import Link            from 'next/link'
import { NavLinks }     from './NavLinks'
import { MobileNav }    from './MobileNav'
import { CurrencyToggle } from './CurrencyToggle'
import { LanguageToggle } from './LanguageToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Goldee — กลับหน้าแรก"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold-400 text-white text-xs font-bold select-none">
              G
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gold-600 transition-colors">
              Goldee
            </span>
          </Link>

          {/* Desktop navigation — language-aware */}
          <NavLinks />

          {/* Right-side controls */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <CurrencyToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  )
}
