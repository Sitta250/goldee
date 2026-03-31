import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'

export const metadata: Metadata = {
  title: 'ไม่พบหน้านี้',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="py-20 sm:py-32">
      <Container width="narrow">
        <div className="text-center space-y-5">
          <p
            className="text-7xl font-bold text-gold-300 tabular-nums select-none"
            aria-hidden="true"
          >
            404
          </p>
          <h1 className="text-xl font-semibold text-gray-900">ไม่พบหน้านี้</h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            หน้าที่คุณต้องการไม่มีอยู่ในระบบ
            อาจถูกย้ายหรือ URL อาจพิมพ์ผิด
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gold-500 text-white text-sm font-semibold hover:bg-gold-600 transition-colors focus-visible:ring-offset-0"
            >
              ← กลับหน้าหลัก
            </Link>
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              ดูบทความทั้งหมด
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
