/**
 * Composite query for the homepage.
 * Runs all required fetches in parallel and returns a single typed object.
 *
 * Single source of truth for all homepage price data: every UI block that
 * shows a number must trace back to the `latestPrice.snapshot` returned here.
 * The `analysis` field is validated against that same snapshot before being
 * returned — callers must not fetch a parallel analysis independently.
 */

import { getLatestSnapshot, getPreviousSnapshot, getLatestSummary } from './prices'
import { getLatestArticles }   from './articles'
import { getPublishedFaqItems } from './faq'
import { getLatestAnalysis }   from './analysis'
import { calculateChange }     from '@/lib/utils/trend'
import type { LatestPriceData, DailySummary, GoldPriceSnapshot } from '@/types/gold'
import type { ArticleCardData } from '@/types/article'
import type { FaqItemDisplay }  from '@/types/faq'
import type { GoldAnalysisRecord } from '@/types/analysis'

export interface HomepageData {
  latestPrice: LatestPriceData | null   // null if DB has no snapshots yet
  summary:     DailySummary | null
  articles:    ArticleCardData[]
  faqItems:    FaqItemDisplay[]
  analysis:    GoldAnalysisRecord | null
}

// ─── Analysis ↔ snapshot consistency ─────────────────────────────────────────
// The AI analysis is generated at most twice per day (09:30 and 18:00 UTC+7).
// In the worst case a morning analysis is shown alongside an ~18:00 price —
// a natural gap of up to ~8.5 h.  We warn at 12 h (missed run) and suppress
// the analysis card entirely at 24 h to avoid contradictory numbers.

const ANALYSIS_WARN_THRESHOLD_MS = 12 * 60 * 60 * 1000  // 12 h → log warning
const ANALYSIS_HARD_STALE_MS     = 24 * 60 * 60 * 1000  // 24 h → suppress card

/**
 * Validate that the analysis was based on a price snapshot reasonably close
 * to the snapshot the hero is currently showing.
 *
 * - Returns the analysis unchanged when within acceptable bounds.
 * - Logs a server-side warning when the gap exceeds 12 h (missed cron run).
 * - Returns null when the gap exceeds 24 h so the stale AI card is not shown
 *   alongside a live price that disagrees with the analysis baseline.
 */
export function validateAnalysisForSnapshot(
  snapshot: GoldPriceSnapshot | null,
  analysis: GoldAnalysisRecord | null,
): GoldAnalysisRecord | null {
  if (!analysis || !snapshot) return analysis

  const gapMs = Math.abs(
    snapshot.fetchedAt.getTime() - analysis.basedOnPriceTimestamp.getTime(),
  )

  if (gapMs > ANALYSIS_HARD_STALE_MS) {
    console.warn(
      `[goldee/consistency] Suppressing analysis ${analysis.id}: ` +
      `${Math.round(gapMs / 3_600_000)}h gap vs current snapshot ${snapshot.id}. ` +
      `(analysis.basedOnPriceTimestamp=${analysis.basedOnPriceTimestamp.toISOString()}, ` +
      `snapshot.fetchedAt=${snapshot.fetchedAt.toISOString()})`,
    )
    return null
  }

  if (gapMs > ANALYSIS_WARN_THRESHOLD_MS) {
    console.warn(
      `[goldee/consistency] Large analysis gap (${Math.round(gapMs / 3_600_000)}h): ` +
      `analysis ${analysis.id} based on price at ` +
      `${analysis.basedOnPriceTimestamp.toISOString()}, ` +
      `current snapshot fetched at ${snapshot.fetchedAt.toISOString()}.`,
    )
  }

  return analysis
}

export async function getHomepageData(): Promise<HomepageData> {
  const [latest, previous, summary, articles, faqItems, rawAnalysis] = await Promise.all([
    getLatestSnapshot(),
    getPreviousSnapshot(),
    getLatestSummary(),
    getLatestArticles(3),
    getPublishedFaqItems(),
    getLatestAnalysis(),
  ])

  const latestPrice: LatestPriceData | null = latest
    ? { snapshot: latest, change: calculateChange(latest, previous) }
    : null

  // Validate analysis against the canonical snapshot before returning.
  // Any caller using getHomepageData() gets a pre-validated analysis.
  const analysis = validateAnalysisForSnapshot(latest, rawAnalysis)

  return { latestPrice, summary, articles, faqItems, analysis }
}
