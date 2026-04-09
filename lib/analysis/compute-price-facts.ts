/**
 * Deterministic price fact computation.
 *
 * All numeric comparisons are computed here in TypeScript — never delegated to
 * the LLM. The LLM receives only the pre-computed numbers from this module.
 */

import { db }           from '@/lib/db'
import type { PriceFacts } from '@/types/analysis'

const FLAT_THRESHOLD_PCT = 0.05  // ≤0.05% change is considered "flat"

function direction(pct: number): 'up' | 'down' | 'flat' {
  if (Math.abs(pct) <= FLAT_THRESHOLD_PCT) return 'flat'
  return pct > 0 ? 'up' : 'down'
}

/** Most recent goldBarSell price for a window ending at `before` */
async function snapshotBefore(before: Date): Promise<number | null> {
  const row = await db.goldPriceSnapshot.findFirst({
    where:   { fetchedAt: { lt: before } },
    orderBy: { fetchedAt: 'desc' },
    select:  { goldBarSell: true },
  })
  return row ? Number(row.goldBarSell) : null
}

/** Min and max goldBarSell for the calendar day in UTC+7 */
async function intradayRange(now: Date): Promise<{ lo: number; hi: number } | null> {
  // Start of today in UTC+7 = today UTC midnight - 7h offset, i.e. subtract and realign
  const utcPlus7Offset = 7 * 60 * 60 * 1_000
  const dayStartUtc    = new Date(
    Math.floor((now.getTime() + utcPlus7Offset) / (24 * 60 * 60 * 1_000)) *
      (24 * 60 * 60 * 1_000) -
      utcPlus7Offset,
  )

  const rows = await db.goldPriceSnapshot.findMany({
    where:  { fetchedAt: { gte: dayStartUtc, lte: now } },
    select: { goldBarSell: true },
  })

  if (rows.length === 0) return null

  const prices = rows.map((r) => Number(r.goldBarSell))
  return { lo: Math.min(...prices), hi: Math.max(...prices) }
}

export async function computePriceFacts(): Promise<PriceFacts | null> {
  const latest = await db.goldPriceSnapshot.findFirst({
    orderBy: { fetchedAt: 'desc' },
    select:  { goldBarSell: true, fetchedAt: true },
  })

  if (!latest) return null

  // Use wall-clock time for cutoffs, not the snapshot timestamp.
  // With dedup (no new rows when price is unchanged), latest.fetchedAt can be
  // days old — using it as "now" shifts the 24h/7d windows backward, causing
  // snapshotBefore() to find nothing and fall back to 0 for both comparisons.
  const now          = new Date()
  const current      = Number(latest.goldBarSell)

  const yesterday    = new Date(now.getTime() - 24 * 60 * 60 * 1_000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000)

  const [priceYday, price7d, range] = await Promise.all([
    snapshotBefore(yesterday),
    snapshotBefore(sevenDaysAgo),
    intradayRange(now),
  ])

  const changeYdayAbs = priceYday != null ? current - priceYday : 0
  const changeYdayPct = priceYday != null && priceYday > 0
    ? (changeYdayAbs / priceYday) * 100
    : 0

  const change7dAbs   = price7d != null ? current - price7d : 0
  const change7dPct   = price7d != null && price7d > 0
    ? (change7dAbs / price7d) * 100
    : 0

  const intradayRangeAbs = range ? range.hi - range.lo : 0

  return {
    currentPrice:             current,
    priceTimestamp:           latest.fetchedAt,
    change_vs_yesterday_abs:  round2(changeYdayAbs),
    change_vs_yesterday_pct:  round2(changeYdayPct),
    change_vs_7d_abs:         round2(change7dAbs),
    change_vs_7d_pct:         round2(change7dPct),
    intraday_range_abs:       round2(intradayRangeAbs),
    direction_today:          direction(changeYdayPct),
    direction_week:           direction(change7dPct),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
