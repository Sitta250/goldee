/**
 * Ranks expert commentary items.
 *
 * Factors:
 *  - Source authority (from allowlist)
 *  - Recency (newer = better, decay over 72 hours)
 *  - Gold-specific signal in title/quote
 */

import type { ExpertItem } from '@/types/analysis'

const GOLD_SIGNAL_TERMS = [
  'gold', 'bullion', 'xau', 'precious', 'safe haven',
  'inflation', 'rate', 'dollar', 'fed', 'central bank',
]

function score(item: ExpertItem, now: Date): number {
  let s = item.authorityScore

  // Recency decay over 72 hours
  const ageHours = (now.getTime() - item.publishedAt.getTime()) / 3_600_000
  s *= Math.exp(-0.02 * ageHours)

  // Boost for gold signal in quote
  const text = (item.quote + ' ' + item.expert).toLowerCase()
  for (const term of GOLD_SIGNAL_TERMS) {
    if (text.includes(term)) { s += 1; break }
  }

  return s
}

export function rankExperts(items: ExpertItem[]): ExpertItem[] {
  const now = new Date()

  // Only items from the last 72 hours
  const fresh = items.filter(
    (it) => now.getTime() - it.publishedAt.getTime() < 72 * 3_600_000,
  )

  return fresh
    .map((it) => ({ item: it, s: score(it, now) }))
    .sort((a, b) => b.s - a.s)
    .map(({ item, s }) => ({ ...item, authorityScore: s }))
}
