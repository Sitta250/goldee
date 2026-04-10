import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/about',             label: 'เกี่ยวกับ'   },
  { href: '/about#methodology', label: 'วิธีคำนวณ'  },
  { href: '/articles',          label: 'บทความ'      },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100">
      {/* Gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="space-y-1">
            <p className="font-semibold text-gray-900 tracking-tight">Goldee</p>
            <p className="text-sm text-gray-400">
              อ้างอิงราคาจาก{' '}
              <a
                href="https://www.goldtraders.or.th"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gray-600 transition-colors"
              >
                สมาคมค้าทองคำ
              </a>
              {' '}· ตรวจสอบราคาในช่วงประกาศ (ประมาณ 09:00–18:30 น.)
            </p>
          </div>

          {/* Links */}
          <nav aria-label="ลิงก์ footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-xs text-gray-400 leading-relaxed max-w-2xl">
          ข้อมูลราคาทองบนเว็บไซต์นี้มีวัตถุประสงค์เพื่อเป็นข้อมูลทั่วไปเท่านั้น
          ไม่ถือเป็นคำแนะนำทางการเงินหรือการลงทุนแต่อย่างใด
          ราคาที่แสดงอาจมีความล่าช้าหรือแตกต่างจากราคาซื้อขายจริง
        </p>

        <p className="mt-4 text-xs text-gray-400">
          © {year} Goldee. สงวนลิขสิทธิ์.
        </p>
      </div>
    </footer>
  )
}
