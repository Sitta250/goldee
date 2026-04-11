'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/',         label: 'หน้าแรก' },
  { href: '/history',  label: 'ประวัติราคา' },
  { href: '/articles', label: 'บทความ' },
  { href: '/about',    label: 'เกี่ยวกับ' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />
          {/* Panel */}
          <nav
            className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            aria-label="เมนูหลัก"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-900">เมนู</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="ปิดเมนู"
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto py-3">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block px-5 py-3 text-base font-medium transition-colors ${
                        active
                          ? 'text-gold-600 bg-gold-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
