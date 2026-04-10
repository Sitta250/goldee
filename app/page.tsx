import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getLatestSnapshot,
  getPreviousSnapshot,
  getYesterdaySnapshot,
  getLatestSummary,
} from '@/lib/queries/prices'
import { getLatestArticles }   from '@/lib/queries/articles'
import { getPublishedFaqItems } from '@/lib/queries/faq'
import { getLatestAnalysis }   from '@/lib/queries/analysis'
import { validateAnalysisForSnapshot } from '@/lib/queries/homepage'
import { calculateChange }     from '@/lib/utils/trend'
import { buildMetadata }       from '@/lib/utils/metadata'
import { isThaiGoldPollingWindow } from '@/lib/utils/thai-market-hours'
import type { GoldPriceSnapshot, LatestPriceData } from '@/types/gold'

import { Container }             from '@/components/layout/Container'
import { PriceHero }             from '@/components/price/PriceHero'
import { NoPriceData }           from '@/components/home/NoPriceData'
import { DailySummaryCard }      from '@/components/home/DailySummaryCard'
import { GoldAnalysisCard }      from '@/components/home/GoldAnalysisCard'
import { ArticlesSectionHeader } from '@/components/home/ArticlesSectionHeader'
import { FaqSection }            from '@/components/home/FaqSection'
import { CalculatorPreview }     from '@/components/calculator/CalculatorPreview'
import { ArticleGrid }           from '@/components/articles/ArticleGrid'
import { AdSidebar }               from '@/components/ads/AdSidebar'
import { Divider }                 from '@/components/ui/Divider'
import { BelowFoldSkeleton }       from '@/components/ui/LoadingSkeleton'
import { TradingViewChartClient as TradingViewChart } from '@/components/chart/TradingViewChartClient'
import { DataStaleBanner }         from '@/components/home/DataStaleBanner'
import { AnalysisUnavailableCard } from '@/components/home/AnalysisUnavailableCard'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'ราคาทองวันนี้ — ทองคำแท่งและทองรูปพรรณ',
  description:
    'ราคาทองคำวันนี้ล่าสุด ทองคำแท่ง 96.5% และทองรูปพรรณ ตรวจสอบราคาในช่วงประกาศ (ประมาณ 09:00–18:30 น. ไทย) พร้อมกราฟและเครื่องคิดเลขทอง',
  canonical:   '/',
})

// Revalidate every 5 minutes — aligns with in-session polling cadence (not 24/7)
export const revalidate = 300

// ─── AI rationale teaser ──────────────────────────────────────────────────────
// Rendered above the fold in its own Suspense so it doesn't block the hero.
// Shows the analysis headline only — one line that answers "why is gold moving?".
// getLatestAnalysis() is React-cached so this shares the DB hit with BelowFold.

async function RationaleTeaserStrip({
  snapshot,
}: {
  snapshot: GoldPriceSnapshot
}) {
  const rawAnalysis = await getLatestAnalysis()
  const analysis = validateAnalysisForSnapshot(snapshot, rawAnalysis)
  if (!analysis) return null

  const headline = analysis.payload.price_analysis.headline.th

  return (
    <div className="flex items-start gap-2.5 rounded-card border border-amber-100 bg-amber-50 px-4 py-3">
      <span className="shrink-0 mt-0.5 text-[10px] font-bold tracking-wide text-amber-600 bg-amber-100 rounded px-1.5 py-0.5">
        AI
      </span>
      <p className="text-sm text-gray-700 leading-snug">{headline}</p>
    </div>
  )
}

// ─── Below-fold async section ─────────────────────────────────────────────────
// Fetches summary, analysis, articles, FAQ in parallel.
// Wrapped in <Suspense> so the hero, teaser, calculator, and chart stream first.

async function BelowFold({ latestPrice }: { latestPrice: LatestPriceData | null }) {
  const [summary, rawAnalysis, articles, faqItems] = await Promise.all([
    getLatestSummary(),
    getLatestAnalysis(),
    getLatestArticles(3),
    getPublishedFaqItems(),
  ])

  // Validate analysis against the canonical snapshot the hero is showing.
  // Returns null (suppresses the card) if the analysis is > 24 h stale relative
  // to the current price, preventing contradictory numbers from reaching the user.
  const analysis = validateAnalysisForSnapshot(latestPrice?.snapshot ?? null, rawAnalysis)

  return (
    <>
      {/* AI gold analysis — rendered from cached DB record; unavailable card when suppressed */}
      {analysis ? (
        <GoldAnalysisCard analysis={analysis} />
      ) : (
        <AnalysisUnavailableCard />
      )}

      <Divider />

      {/* Latest 3 articles */}
      <section aria-labelledby="articles-heading">
        <ArticlesSectionHeader />
        <ArticleGrid articles={articles} />
      </section>

      <Divider />

      {/* Plain-language daily summary — OHLC + narrative, shown after articles as supporting context */}
      {summary && (
        <>
          <DailySummaryCard
            summaryTh={summary.summaryTh}
            highBarSell={summary.highBarSell}
            lowBarSell={summary.lowBarSell}
            openBarSell={summary.openBarSell}
            closeBarSell={summary.closeBarSell}
          />
          <Divider />
        </>
      )}

      {/* FAQ — loaded from DB, falls back to empty state */}
      <FaqSection items={faqItems} />
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
//
// Above-the-fold section order (designed for iPhone-sized viewport):
//   1. PriceHero    — buy/sell prices, both change deltas, timestamps
//   2. Rationale    — one-line AI headline ("why is gold moving?") in Suspense
//   3. Calculator   — interactive quick-calc + prominent full-page CTA
//   4. Chart        — TradingView price chart (large, intentionally below fold)
//   5. BelowFold    — summary, full analysis, articles, FAQ

export default async function HomePage() {
  const [latest, previous, yesterdaySnap] = await Promise.all([
    getLatestSnapshot(),
    getPreviousSnapshot(),
    getYesterdaySnapshot(),
  ])

  const latestPrice: LatestPriceData | null = latest
    ? { snapshot: latest, change: calculateChange(latest, previous) }
    : null

  // "vs yesterday" = change from last price before today's UTC+7 midnight close.
  // Distinct from "vs previous" (last 5-min snapshot) — shown as a second delta row.
  const changeFromYesterday = latest && yesterdaySnap
    ? calculateChange(latest, yesterdaySnap)
    : null

  const isWithinPollingWindow = isThaiGoldPollingWindow()

  return (
    <div className="pt-4 pb-6 sm:py-8">
      <Container>
        <div className="flex gap-8 items-start">

          {/* ── Main column ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* 1a. Stale / session banner — market-hours aware */}
            {latest && (
              <DataStaleBanner
                lastSeenAt={latest.lastSeenAt}
                isWithinPollingWindow={isWithinPollingWindow}
              />
            )}

            {/* 1b. Hero — buy/sell cards, vs-previous + vs-yesterday deltas, timestamps */}
            {latestPrice ? (
              <PriceHero data={latestPrice} changeFromYesterday={changeFromYesterday} />
            ) : (
              <NoPriceData />
            )}

            {/* 2. AI rationale teaser — same validation as full card; only when we have a price snapshot */}
            {latestPrice && (
              <Suspense fallback={
                <div className="h-10 rounded-card bg-gray-100 animate-pulse" aria-hidden />
              }>
                <RationaleTeaserStrip snapshot={latestPrice.snapshot} />
              </Suspense>
            )}

            {/* 3. Calculator — interactive quick-calc above the chart */}
            {latestPrice && (
              <CalculatorPreview goldBarSell={latestPrice.snapshot.goldBarSell} />
            )}

            {/* 4. Price chart (below fold on mobile — users scroll after seeing price + calc) */}
            <TradingViewChart />

            {/* 5. Below-fold: daily summary, full AI analysis, articles, FAQ */}
            <div className="pt-4">
            <Suspense fallback={<BelowFoldSkeleton />}>
              <BelowFold latestPrice={latestPrice} />
            </Suspense>
            </div>

          </div>

          {/* ── Desktop sidebar ad (hidden below lg breakpoint) ──────────────── */}
          <AdSidebar />

        </div>
      </Container>
    </div>
  )
}
