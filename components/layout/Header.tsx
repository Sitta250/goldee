import Link from 'next/link'
import { MobileNav } from './MobileNav'

const NAV_LINKS = [
  { href: '/',           label: 'หน้าแรก' },
  { href: '/history',   label: 'ประวัติราคา' },
  { href: '/calculator',label: 'คำนวณทอง' },
  { href: '/articles',  label: 'บทความ' },
  { href: '/about',     label: 'เกี่ยวกับ' },
]

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
            {/* TODO: Replace with a real SVG logo */}
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold-400 text-white text-xs font-bold select-none">
              G
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-gold-600 transition-colors">
              Goldee
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="เมนูหลัก" className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile nav (client component — handles toggle state) */}
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
