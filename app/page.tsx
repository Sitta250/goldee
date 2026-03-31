import type { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { PriceHero } from '@/components/price/PriceHero'
import { TrendChart } from '@/components/chart/TrendChart'
import { DailySummaryCard } from '@/components/home/DailySummaryCard'
import { CalculatorPreview } from '@/components/calculator/CalculatorPreview'
import { ArticleGrid } from '@/components/articles/ArticleGrid'
import { FaqSection } from '@/components/home/FaqSection'
import { AdRectangle } from '@/components/ads/AdRectangle'
import { AdSidebar } from '@/components/ads/AdSidebar'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'

// TODO: Uncomment when DB queries are wired up
// import { getLatestSnapshot, getPreviousSnapshot, getSnapshotsByRange } from '@/lib/queries/prices'
// import { getLatestArticles } from '@/lib/queries/articles'
// import { calculateChange } from '@/lib/utils/trend'
// import { db } from '@/lib/db'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'ราคาทองวันนี้ — ทองคำแท่งและทองรูปพรรณ',
  description:
    'ราคาทองคำวันนี้ล่าสุด ทองคำแท่ง 96.5% และทองรูปพรรณ อัพเดทอัตโนมัติทุก 5 นาที พร้อมกราฟแนวโน้มและเครื่องคิดเลข',
  alternates: { canonical: '/' },
}

// ─── Revalidate every 5 minutes (matches cron interval) ──────────────────────
export const revalidate = 300

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // TODO: Replace mock data with real DB queries when Phase 1 cron is wired up.
  //
  // const [latest, previous, chartData, articles, summary] = await Promise.all([
  //   getLatestSnapshot(),
  //   getPreviousSnapshot(),
  //   getSnapshotsByRange('1D'),
  //   getLatestArticles(3),
  //   db.dailySummary.findFirst({ orderBy: { date: 'desc' } }),
  // ])
  //
  // if (!latest) return <NoPriceDataFallback />
  // const change = calculateChange(latest, previous)
  // const latestPrice: LatestPriceData = { snapshot: latest, change }

  // ── Mock data (remove in Phase 2) ────────────────────────────────────────
  const mockSnapshot = {
    id:          'mock-001',
    fetchedAt:   new Date(),
    goldBarBuy:  47400,
    goldBarSell: 47500,
    jewelryBuy:  46700,
    jewelrySell: 48093,
    source:      'mock',
  }
  const mockChange = { amount: 100, percent: 0.21, direction: 'up' as const }
  const mockLatestPrice = { snapshot: mockSnapshot, change: mockChange }

  const mockChartData = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
    barSell:   47200 + Math.round(Math.sin(i * 0.5) * 200 + Math.random() * 100),
  }))

  const mockArticles = [
    {
      slug:         'why-gold-price-rises',
      titleTh:      'ทำไมราคาทองถึงขึ้นในช่วงนี้?',
      summaryTh:    'เจาะลึกปัจจัยที่ทำให้ราคาทองคำพุ่งสูงขึ้น ตั้งแต่ดอลลาร์อ่อนค่าไปจนถึงความต้องการทองโลก',
      coverImageUrl:null,
      category:     'explainer' as const,
      publishedAt:  new Date('2025-03-28'),
    },
    {
      slug:         'gold-bar-vs-jewelry',
      titleTh:      'ซื้อทองแท่งหรือทองรูปพรรณ อะไรดีกว่ากัน?',
      summaryTh:    'เปรียบเทียบข้อดีข้อเสียของทองแท่งและทองรูปพรรณ เพื่อช่วยให้คุณตัดสินใจได้ถูกต้อง',
      coverImageUrl:null,
      category:     'guide' as const,
      publishedAt:  new Date('2025-03-25'),
    },
    {
      slug:         'gold-saving-beginners',
      titleTh:      'มือใหม่ออมทอง: เริ่มต้นอย่างไรให้ถูกวิธี',
      summaryTh:    'คู่มือฉบับย่อสำหรับผู้ที่ต้องการเริ่มออมทองเป็นครั้งแรก ข้อควรรู้และข้อผิดพลาดที่ควรหลีกเลี่ยง',
      coverImageUrl:null,
      category:     'guide' as const,
      publishedAt:  new Date('2025-03-20'),
    },
  ]

  const mockSummary = {
    summaryTh:
      'วันนี้ราคาทองคำแท่งปรับตัวขึ้น 100 บาท จากแรงซื้อในตลาดโลกหลังดัชนีดอลลาร์อ่อนค่าลง แนวโน้มระยะสั้นยังเป็นขาขึ้น',
    highBarSell:  47600,
    lowBarSell:   47300,
    openBarSell:  47350,
    closeBarSell: 47500,
  }
  // ── End mock data ──────────────────────────────────────────────────────────

  return (
    <div className="py-6 sm:py-8 space-y-10">
      <Container>
        {/* ── Main content + optional desktop sidebar ─────────────────────── */}
        <div className="flex gap-8 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* 1. Price Hero */}
            <PriceHero data={mockLatestPrice} />

            {/* 2. Trend Chart */}
            <TrendChart initialData={mockChartData} initialRange="1D" />

            {/* 3. In-content ad */}
            <AdRectangle />

            {/* 4. Daily Summary */}
            <DailySummaryCard {...mockSummary} />

            {/* 5. Calculator preview */}
            <CalculatorPreview goldBarSell={mockSnapshot.goldBarSell} />

            <Divider />

            {/* 6. Latest articles */}
            <section aria-labelledby="articles-heading">
              <SectionHeading
                title="บทความล่าสุด"
                subtitle="ความรู้และข่าวสารเกี่ยวกับทองคำ"
                className="mb-5"
                action={
                  <Link
                    href="/articles"
                    className="text-sm text-gold-600 hover:underline font-medium"
                  >
                    ดูทั้งหมด →
                  </Link>
                }
              />
              <ArticleGrid articles={mockArticles} />
            </section>

            <Divider />

            {/* 7. FAQ */}
            <FaqSection />
          </div>

          {/* Desktop sidebar ad (hidden on mobile) */}
          <AdSidebar />
        </div>
      </Container>
    </div>
  )
}
