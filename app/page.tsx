import type { Metadata } from 'next'

import { getHomepageData }        from '@/lib/queries/homepage'
import { buildMetadata }          from '@/lib/utils/metadata'
import { Container }              from '@/components/layout/Container'
import { PriceHero }              from '@/components/price/PriceHero'
import { TradingViewChart }        from '@/components/chart/TradingViewChart'
import { DailySummaryCard }       from '@/components/home/DailySummaryCard'
import { GoldAnalysisCard }       from '@/components/home/GoldAnalysisCard'
import { ArticlesSectionHeader }  from '@/components/home/ArticlesSectionHeader'
import { FaqSection }             from '@/components/home/FaqSection'
import { CalculatorPreview }      from '@/components/calculator/CalculatorPreview'
import { ArticleGrid }            from '@/components/articles/ArticleGrid'
import { AdSidebar }              from '@/components/ads/AdSidebar'
import { Divider }                from '@/components/ui/Divider'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'ราคาทองวันนี้ — ทองคำแท่งและทองรูปพรรณ',
  description: 'ราคาทองคำวันนี้ล่าสุด ทองคำแท่ง 96.5% และทองรูปพรรณ อัพเดทอัตโนมัติทุก 5 นาที พร้อมกราฟแนวโน้มและเครื่องคิดเลขทอง',
  canonical:   '/',
})

// Revalidate every 5 minutes — matches the cron ingestion interval
export const revalidate = 300

// ─── Empty state (client so it can read language context) ─────────────────────

import { NoPriceData } from '@/components/home/NoPriceData'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { latestPrice, summary, articles, faqItems, analysis } =
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

            {/* 3. Price charts — toggle between Thai Gold (THB) and XAU/USD */}
            <TradingViewChart />

            {/* 6. Plain-language daily summary (skipped if not yet generated) */}
            {summary && (
              <DailySummaryCard
                summaryTh={summary.summaryTh}
                highBarSell={summary.highBarSell}
                lowBarSell={summary.lowBarSell}
                openBarSell={summary.openBarSell}
                closeBarSell={summary.closeBarSell}
              />
            )}

            {/* 5. AI gold analysis — rendered from cached DB record */}
            {analysis && <GoldAnalysisCard analysis={analysis} />}

            {/* 6. Quick calculator preview (requires a live price) */}
            {latestPrice && (
              <CalculatorPreview
                goldBarSell={latestPrice.snapshot.goldBarSell}
              />
            )}

            <Divider />

            {/* 6. Latest 3 articles */}
            <section aria-labelledby="articles-heading">
              <ArticlesSectionHeader />
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
