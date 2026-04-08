import type { Metadata } from 'next'
import Link from 'next/link'

import { getHomepageData }    from '@/lib/queries/homepage'
import { buildMetadata }      from '@/lib/utils/metadata'
import { Container }          from '@/components/layout/Container'
import { PriceHero }          from '@/components/price/PriceHero'
import { TradingViewChart }   from '@/components/chart/TradingViewChart'
import { DailySummaryCard }   from '@/components/home/DailySummaryCard'
import { FaqSection }         from '@/components/home/FaqSection'
import { CalculatorPreview }  from '@/components/calculator/CalculatorPreview'
import { ArticleGrid }        from '@/components/articles/ArticleGrid'
import { AdRectangle }        from '@/components/ads/AdRectangle'
import { AdSidebar }          from '@/components/ads/AdSidebar'
import { SectionHeading }     from '@/components/ui/SectionHeading'
import { Divider }            from '@/components/ui/Divider'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'ราคาทองวันนี้ — ทองคำแท่งและทองรูปพรรณ',
  description: 'ราคาทองคำวันนี้ล่าสุด ทองคำแท่ง 96.5% และทองรูปพรรณ อัพเดทอัตโนมัติทุก 5 นาที พร้อมกราฟแนวโน้มและเครื่องคิดเลขทอง',
  canonical:   '/',
})

// Revalidate every 5 minutes — matches the cron ingestion interval
export const revalidate = 300

// ─── Empty state — shown when the DB has no snapshots yet ─────────────────────
// This renders on a brand-new deployment before the cron runs for the first time.

function NoPriceData() {
  return (
    <section className="rounded-card bg-white border border-gray-100 shadow-card p-10 text-center space-y-3">
      <p className="text-4xl select-none">📊</p>
      <p className="text-base font-semibold text-gray-700">
        ยังไม่มีข้อมูลราคาทอง
      </p>
      <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
        ระบบกำลังเริ่มต้น — ราคาจะปรากฏโดยอัตโนมัติหลังการดึงข้อมูลครั้งแรก
        (ทุก 5 นาทีในวันทำการ)
      </p>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { latestPrice, summary, articles, faqItems } =
    await getHomepageData()

  return (
    <div className="py-6 sm:py-8">
      <Container>
        <div className="flex gap-8 items-start">

          {/* ── Main column ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* 1. Hero: bar buy/sell + jewelry buy/sell + last updated + change */}
            {latestPrice ? (
              <PriceHero data={latestPrice} />
            ) : (
              <NoPriceData />
            )}

            {/* 2. TradingView chart — XAU/USD advanced chart widget */}
            <TradingViewChart />

            {/* 3. In-content ad slot */}
            <AdRectangle />

            {/* 4. Plain-language daily summary (skipped if not yet generated) */}
            {summary && (
              <DailySummaryCard
                summaryTh={summary.summaryTh}
                highBarSell={summary.highBarSell}
                lowBarSell={summary.lowBarSell}
                openBarSell={summary.openBarSell}
                closeBarSell={summary.closeBarSell}
              />
            )}

            {/* 5. Quick calculator preview (requires a live price) */}
            {latestPrice && (
              <CalculatorPreview
                goldBarSell={latestPrice.snapshot.goldBarSell}
              />
            )}

            <Divider />

            {/* 6. Latest 3 articles */}
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
              <ArticleGrid articles={articles} />
            </section>

            <Divider />

            {/* 7. FAQ — loaded from DB, falls back to empty state */}
            <FaqSection items={faqItems} />

          </div>

          {/* ── Desktop sidebar ad (hidden below lg breakpoint) ──────────────── */}
          <AdSidebar />

        </div>
      </Container>
    </div>
  )
}
