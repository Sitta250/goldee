import type { Metadata, Viewport } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

import { Header }    from '@/components/layout/Header'
import { Footer }    from '@/components/layout/Footer'
import { AdBanner }  from '@/components/ads/AdBanner'
import { AdFooter }  from '@/components/ads/AdFooter'

// ─── Thai-supporting Google Font ──────────────────────────────────────────────
const sarabun = Sarabun({
  subsets:  ['thai', 'latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
  display:  'swap',
})

// ─── Site-wide metadata defaults ──────────────────────────────────────────────
// Individual pages override title, description, and openGraph via their own
// metadata export. The template appends " | Goldee" to every page title.

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default:  'Goldee — ราคาทองวันนี้',
    template: '%s | Goldee',
  },
  description:
    'ราคาทองคำวันนี้ ทองคำแท่งและทองรูปพรรณ อัพเดทล่าสุดทุก 5 นาที พร้อมกราฟแนวโน้มและเครื่องคิดเลขทอง',
  keywords: [
    'ราคาทอง', 'ราคาทองวันนี้', 'ราคาทองคำแท่ง', 'ทองรูปพรรณ',
    'gold price thailand', 'ราคาทองล่าสุด', 'สมาคมค้าทองคำ',
  ],
  authors:  [{ name: 'Goldee' }],
  creator:  'Goldee',
  openGraph: {
    type:      'website',
    locale:    'th_TH',
    url:       '/',
    siteName:  'Goldee',
    title:     'Goldee — ราคาทองวันนี้',
    description:
      'ราคาทองคำวันนี้ ทองคำแท่งและทองรูปพรรณ อัพเดทอัตโนมัติทุก 5 นาที',
    images: [{
      url:    '/og-image.png',
      width:  1200,
      height: 630,
      alt:    'Goldee — ราคาทองวันนี้',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Goldee — ราคาทองวันนี้',
    description: 'ราคาทองคำวันนี้ ทองคำแท่งและทองรูปพรรณ อัพเดทอัตโนมัติทุก 5 นาที',
    images:      ['/og-image.png'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-video-preview':  -1,
      'max-image-preview':  'large',
      'max-snippet':        -1,
    },
  },
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#d4911a',
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        {/* Skip-to-content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:bg-gold-500 focus:text-white focus:text-sm"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>

        <Header />
        <AdBanner />

        <main id="main-content" className="min-h-screen">
          {children}
        </main>

        <AdFooter />
        <Footer />
      </body>
    </html>
  )
}
