/**
 * Assembles and hashes the input bundle that will be passed to the Gemini
 * summarizer. The SHA-256 hash is used for idempotency: if the bundle for a
 * given run window has not changed, we can skip regenerating the analysis.
 */

import { createHash }              from 'crypto'
import type { AnalysisInputBundle, PriceFacts, NewsItem, ExpertItem } from '@/types/analysis'

export function buildInputBundle(
  priceFacts:  PriceFacts,
  newsItems:   NewsItem[],
  expertItems: ExpertItem[],
): AnalysisInputBundle {
  return { priceFacts, newsItems, expertItems }
}

/** Stable SHA-256 of the serialised bundle */
export function hashInputBundle(bundle: AnalysisInputBundle): string {
  const stable = JSON.stringify({
    price: {
      current:        bundle.priceFacts.currentPrice,
      ydayDelta:      bundle.priceFacts.change_vs_yesterday_abs,
      weekDelta:      bundle.priceFacts.change_vs_7d_abs,
      // Discrete signals: any change in enum value should trigger regeneration
      trendDirection: bundle.priceFacts.trend_direction,
      biasToday:      bundle.priceFacts.bias_today,
      biasWeek:       bundle.priceFacts.bias_week,
    },
    // Use title + publishedAt as the fingerprint — summaries can be truncated differently
    news:    bundle.newsItems.map((n) => `${n.title}|${n.publishedAt.toISOString()}`),
    experts: bundle.expertItems.map((e) => `${e.expert}|${e.publishedAt.toISOString()}`),
  })

  return createHash('sha256').update(stable).digest('hex')
}

/** ISO 8601 interval string describing the news window */
export function buildNewsWindow(newsItems: NewsItem[]): string {
  if (newsItems.length === 0) {
    const now = new Date()
    return `${new Date(now.getTime() - 24 * 3_600_000).toISOString()}/${now.toISOString()}`
  }

  const times       = newsItems.map((n) => n.publishedAt.getTime())
  const earliest    = new Date(Math.min(...times))
  const latest      = new Date(Math.max(...times))
  return `${earliest.toISOString()}/${latest.toISOString()}`
}
