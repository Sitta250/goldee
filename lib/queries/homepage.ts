/**
 * Composite query for the homepage.
 * Runs all required fetches in parallel and returns a single typed object.
 */

import { getLatestSnapshot, getPreviousSnapshot, getLatestSummary } from './prices'
import { getLatestArticles }   from './articles'
import { getPublishedFaqItems } from './faq'
import { calculateChange }     from '@/lib/utils/trend'
import type { LatestPriceData, DailySummary } from '@/types/gold'
import type { ArticleCardData } from '@/types/article'
import type { FaqItemDisplay }  from '@/types/faq'

export interface HomepageData {
  latestPrice: LatestPriceData | null   // null if DB has no snapshots yet
  summary:     DailySummary | null
  articles:    ArticleCardData[]
  faqItems:    FaqItemDisplay[]
}

export async function getHomepageData(): Promise<HomepageData> {
  const [latest, previous, summary, articles, faqItems] = await Promise.all([
    getLatestSnapshot(),
    getPreviousSnapshot(),
    getLatestSummary(),
    getLatestArticles(3),
    getPublishedFaqItems(),
  ])

  const latestPrice: LatestPriceData | null = latest
    ? { snapshot: latest, change: calculateChange(latest, previous) }
    : null

  return { latestPrice, summary, articles, faqItems }
}
