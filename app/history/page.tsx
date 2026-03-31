import type { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { TrendChart } from '@/components/chart/TrendChart'
import { PriceTable } from '@/components/price/PriceTable'
import { AdRectangle } from '@/components/ads/AdRectangle'
import { SectionHeading } from '@/components/ui/SectionHeading'

// TODO: Uncomment when DB is ready
// import { getSnapshotsByRange, getPaginatedSnapshots } from '@/lib/queries/prices'

export const metadata: Metadata = {
  title: 'ประวัติราคาทอง',
  description:
    'ดูประวัติราคาทองคำย้อนหลัง ทองคำแท่งและทองรูปพรรณ พร้อมกราฟแนวโน้มตั้งแต่ 1 วันถึง 1 ปี',
  alternates: { canonical: '/history' },
}

export const revalidate = 300

export default async function HistoryPage() {
  // TODO: Replace with real DB queries
  // const [chartData, { rows, total }] = await Promise.all([
  //   getSnapshotsByRange('7D'),
  //   getPaginatedSnapshots(1, 30),
  // ])

  // ── Mock chart data ────────────────────────────────────────────────────────
  const mockChartData = Array.from({ length: 7 * 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (7 * 24 - i) * 60 * 60 * 1000).toISOString(),
    barSell:   47000 + Math.round(Math.sin(i * 0.3) * 400 + Math.random() * 150),
  }))

  // ── Mock table rows ────────────────────────────────────────────────────────
  const mockRows = Array.from({ length: 15 }, (_, i) => ({
    id:          `mock-${i}`,
    fetchedAt:   new Date(Date.now() - i * 5 * 60 * 1000),
    goldBarBuy:  47400 - i * 5,
    goldBarSell: 47500 - i * 5,
    jewelryBuy:  46700 - i * 4,
    jewelrySell: 48093 - i * 5,
    source:      'mock',
  }))

  return (
    <div className="py-6 sm:py-8 space-y-8">
      <Container>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติราคาทอง</h1>
        <p className="text-sm text-gray-500 mt-1">
          ราคาทองคำแท่ง 96.5% อัพเดทอัตโนมัติทุก 5 นาที
        </p>
      </Container>

      <Container>
        {/* Full-size trend chart — defaults to 7D on this page */}
        <TrendChart initialData={mockChartData} initialRange="7D" />
      </Container>

      <Container>
        <AdRectangle />
      </Container>

      <Container>
        <SectionHeading
          title="ตารางราคาย้อนหลัง"
          subtitle="ราคาล่าสุด 30 รายการ"
          className="mb-4"
        />

        {/* TODO: Add pagination controls when real data is wired up */}
        <PriceTable rows={mockRows} highlightFirst />

        {/* Pagination placeholder */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
          {/* TODO: Build a Pagination component for page > 1 */}
          <span>หน้า 1 จาก 1</span>
        </div>
      </Container>
    </div>
  )
}
