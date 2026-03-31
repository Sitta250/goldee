/**
 * Composite query for the homepage.
 * Runs all required fetches in parallel and returns a single typed object.
 * Import this in app/page.tsx to replace the individual TODO calls.
 */

import { getLatestSnapshot, getPreviousSnapshot, getSnapshotsByRange, getLatestSummary } from './prices'
import { getLatestArticles } from './articles'
import { getPublishedFaqItems } from './faq'
import { calculateChange } from '@/lib/utils/trend'
import type { LatestPriceData, DailySummary, ChartDataPoint } from '@/types/gold'
import type { ArticleCardData } from '@/types/article'
import type { FaqItemDisplay } from '@/types/faq'

export interface HomepageData {
  latestPrice:  LatestPriceData | null   // null if DB has no snapshots yet
  chartData:    ChartDataPoint[]
  summary:      DailySummary | null
  articles:     ArticleCardData[]
  faqItems:     FaqItemDisplay[]
}

export async function getHomepageData(): Promise<HomepageData> {
  const [latest, previous, chartData, summary, articles, faqItems] = await Promise.all([
    getLatestSnapshot(),
    getPreviousSnapshot(),
    getSnapshotsByRange('1D'),
    getLatestSummary(),
    getLatestArticles(3),
    getPublishedFaqItems(),
  ])

  const latestPrice: LatestPriceData | null = latest
    ? { snapshot: latest, change: calculateChange(latest, previous) }
    : null

  return { latestPrice, chartData, summary, articles, faqItems }
}

// ─── History page composite query ─────────────────────────────────────────────

import { getPaginatedSnapshots } from './prices'
import type { Timeframe, GoldPriceSnapshot } from '@/types/gold'

export interface HistoryPageData {
  chartData: ChartDataPoint[]
  rows:      GoldPriceSnapshot[]
  total:     number
  page:      number
  perPage:   number
}

export async function getHistoryPageData(
  range:   Timeframe = '7D',
  page     = 1,
  perPage  = 30,
): Promise<HistoryPageData> {
  const [chartData, { rows, total }] = await Promise.all([
    getSnapshotsByRange(range),
    getPaginatedSnapshots(page, perPage),
  ])

  return { chartData, rows, total, page, perPage }
}
