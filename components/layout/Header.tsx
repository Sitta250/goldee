import Link            from 'next/link'
import { NavLinks }     from './NavLinks'
import { MobileNav }    from './MobileNav'
import { CurrencyToggle } from './CurrencyToggle'
import { LanguageToggle } from './LanguageToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-15 items-center justify-between gap-4" style={{ height: '3.75rem' }}>
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Goldee — กลับหน้าแรก"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white text-xs font-bold select-none shadow-sm">
              G
            </span>
            <span className="text-base font-bold tracking-tight text-gray-900 group-hover:text-gold-600 transition-colors duration-150">
              Goldee
            </span>
          </Link>

          {/* Desktop navigation */}
          <NavLinks />

          {/* Right-side controls */}
          <div className="flex items-center gap-1.5">
            <LanguageToggle />
            <CurrencyToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  )
}
