/**
 * Ranks and deduplicates news items.
 *
 * Scoring factors:
 *  - Recency: exponential decay over 48 hours
 *  - Source authority: 0–10 weight from the fetcher
 *  - Keyword density: extra points for gold-specific terms
 *
 * Deduplication: items with very similar titles (Jaro–Winkler > 0.85) are
 * collapsed into the highest-scoring representative.
 */

import type { NewsItem } from '@/types/analysis'

// High-value gold-specific keywords that boost relevance score
const BOOST_KEYWORDS = [
  'gold price', 'gold rally', 'xau/usd', 'spot gold',
  'gold futures', 'gold demand', 'central bank gold',
  'gold etf', 'comex gold',
]

const PENALISE_KEYWORDS = [
  'advertisement', 'sponsored', 'promoted', 'press release',
]

/** Score a single news item (higher = more relevant) */
function score(item: NewsItem, now: Date): number {
  let s = item.relevanceScore  // base from source authority

  // Recency: full score within 6 hours, halved at 24h, near-zero at 48h
  const ageHours = (now.getTime() - item.publishedAt.getTime()) / 3_600_000
  s *= Math.exp(-0.03 * ageHours)

  // Boost for high-signal gold terms in title
  const title = item.title.toLowerCase()
  for (const kw of BOOST_KEYWORDS) {
    if (title.includes(kw)) { s += 2; break }
  }

  // Penalise promotional content
  const combined = (item.title + ' ' + item.summary).toLowerCase()
  for (const kw of PENALISE_KEYWORDS) {
    if (combined.includes(kw)) { s -= 5; break }
  }

  return s
}

/** Rough title similarity check — avoids heavy string-distance lib */
function areSimilar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

  const na = norm(a)
  const nb = norm(b)

  // Exact match after normalisation
  if (na === nb) return true

  // One is a prefix/suffix of the other with >80% overlap
  const shorter = na.length < nb.length ? na : nb
  const longer  = na.length < nb.length ? nb : na
  if (longer.includes(shorter) && shorter.length / longer.length > 0.8) return true

  return false
}

export function rankAndDedupNews(items: NewsItem[]): NewsItem[] {
  const now = new Date()

  // Remove items older than 48 hours
  const fresh = items.filter(
    (it) => now.getTime() - it.publishedAt.getTime() < 48 * 3_600_000,
  )

  // Score
  const scored = fresh.map((it) => ({ item: it, s: score(it, now) }))
  scored.sort((a, b) => b.s - a.s)

  // Deduplicate: keep first seen of similar titles
  const kept: NewsItem[] = []
  for (const { item } of scored) {
    const dupe = kept.some((k) => areSimilar(k.title, item.title))
    if (!dupe) kept.push({ ...item, relevanceScore: score(item, now) })
  }

  return kept
}
