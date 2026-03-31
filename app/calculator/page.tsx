import type { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { GoldCalculator } from '@/components/calculator/GoldCalculator'
import { LastUpdated } from '@/components/price/LastUpdated'

// TODO: Uncomment when DB is ready
// import { getLatestSnapshot } from '@/lib/queries/prices'

export const metadata: Metadata = {
  title: 'คำนวณมูลค่าทอง',
  description:
    'เครื่องคิดเลขทองคำ คำนวณมูลค่าทองตามน้ำหนักและความบริสุทธิ์ รองรับทั้งหน่วยบาทและกรัม',
  alternates: { canonical: '/calculator' },
}

export const revalidate = 300

export default async function CalculatorPage() {
  // TODO: Replace with real DB query
  // const latest = await getLatestSnapshot()
  // const goldBarBuy  = latest?.goldBarBuy  ?? 0
  // const goldBarSell = latest?.goldBarSell ?? 0
  // const fetchedAt   = latest?.fetchedAt   ?? new Date()

  // ── Mock data ──────────────────────────────────────────────────────────────
  const goldBarBuy  = 47400
  const goldBarSell = 47500
  const fetchedAt   = new Date()

  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">คำนวณมูลค่าทอง</h1>
          <p className="text-sm text-gray-500">
            คำนวณมูลค่าทองตามน้ำหนักและความบริสุทธิ์ โดยใช้ราคาอ้างอิงล่าสุด
          </p>
          <LastUpdated timestamp={fetchedAt} />
        </div>

        {/* Calculator card */}
        <div className="rounded-card bg-white border border-gray-100 shadow-card p-6 sm:p-8">
          <GoldCalculator goldBarBuy={goldBarBuy} goldBarSell={goldBarSell} />
        </div>

        {/* Methodology note */}
        <div className="mt-6 rounded-card bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 space-y-2">
          <h2 className="font-semibold text-gray-800">วิธีคำนวณ</h2>
          <p>
            <strong>สูตร:</strong> มูลค่า = น้ำหนัก (บาท) × (ความบริสุทธิ์ ÷ 96.5) × ราคาต่อบาท
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
            <li>1 บาทน้ำหนัก = 15.244 กรัม</li>
            <li>ทองคำแท่งมาตรฐาน = 96.5% บริสุทธิ์</li>
            <li>ราคาที่ใช้คำนวณอ้างอิงจากราคาล่าสุดในระบบ</li>
            <li>ผลลัพธ์เป็นค่าประมาณ ราคาจริงอาจแตกต่างตามร้านค้า</li>
          </ul>
        </div>
      </Container>
    </div>
  )
}
