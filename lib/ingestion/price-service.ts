/**
 * Price service — derived data functions.
 *
 * Sits between the DB query layer and the UI.
 * All DB reads go through lib/queries/; this layer adds computation only.
 * No writes happen here.
 */

import type {
  GoldPriceSnapshot,
  PriceChange,
  LatestPriceData,
  ChartDataPoint,
  Timeframe,
} from '@/types/gold'
import {
  getLatestSnapshot,
  getPreviousSnapshot,
  getSnapshotsByRange,
} from '@/lib/queries/prices'

// ─── Change computation ────────────────────────────────────────────────────────

/**
 * Compute the price change between two snapshots using gold bar sell price.
 *
 * Returns:
 *   amount    — absolute delta, always non-negative
 *   percent   — percentage change, always non-negative, rounded to 2 dp
 *   direction — 'up' | 'down' | 'flat'
 */
export function comparePriceSnapshots(
  current:  GoldPriceSnapshot,
  previous: GoldPriceSnapshot | null,
): PriceChange {
  if (!previous) {
    return { amount: 0, percent: 0, direction: 'flat' }
  }

  const delta   = current.goldBarSell - previous.goldBarSell
  const percent =
    previous.goldBarSell !== 0
      ? Math.abs((delta / previous.goldBarSell) * 100)
      : 0

  return {
    amount:    Math.abs(delta),
    percent:   Math.round(percent * 100) / 100,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  }
}

/**
 * Compute the change amount in THB (signed — positive = up, negative = down).
 * Useful for displaying "+150" or "−200" with colour coding.
 */
export function priceChangeAmount(
  current:  GoldPriceSnapshot,
  previous: GoldPriceSnapshot | null,
): number {
  if (!previous) return 0
  return current.goldBarSell - previous.goldBarSell
}

// ─── Latest price data ─────────────────────────────────────────────────────────

/**
 * Fetch the latest snapshot and previous snapshot in parallel, compute the change,
 * and return a LatestPriceData bundle ready for the homepage hero component.
 * Returns null if the database has no snapshots yet.
 */
export async function getLatestPriceData(): Promise<LatestPriceData | null> {
  const [current, previous] = await Promise.all([
    getLatestSnapshot(),
    getPreviousSnapshot(),
  ])

  if (!current) return null

  return {
    snapshot: current,
    change:   comparePriceSnapshots(current, previous),
  }
}

// ─── Chart data ────────────────────────────────────────────────────────────────

/**
 * Returns chart-ready data points for a single timeframe.
 * Points are downsampled to ≤200 by the query layer.
 *
 * Downsampling note: this function stays correct after historical rows are
 * pruned in the DB because queries use fetchedAt range filters, not row count.
 */
export async function getChartDataForRange(range: Timeframe): Promise<ChartDataPoint[]> {
  return getSnapshotsByRange(range)
}

/**
 * Pre-fetch chart data for all five timeframes in a single round.
 * Use only when you need all ranges server-side (e.g. pre-rendering a static page).
 * For client-side timeframe switching, fetch one range at a time.
 */
export async function getAllChartRanges(): Promise<Record<Timeframe, ChartDataPoint[]>> {
  const ranges: Timeframe[] = ['1D', '7D', '30D', '6M', '1Y']
  const results = await Promise.all(ranges.map((r) => getSnapshotsByRange(r)))
  return Object.fromEntries(
    ranges.map((r, i) => [r, results[i]]),
  ) as Record<Timeframe, ChartDataPoint[]>
}

// ─── Day direction ─────────────────────────────────────────────────────────────

/**
 * Compute the overall direction of a day from an ordered list of bar-sell prices.
 * Compares first vs last price in the array.
 * Used to determine the colour/icon in the daily summary card.
 */
export function computeDayDirection(
  barSellPrices: number[],
): 'up' | 'down' | 'flat' {
  if (barSellPrices.length < 2) return 'flat'
  const first = barSellPrices[0]
  const last  = barSellPrices[barSellPrices.length - 1]
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'flat'
}

/**
 * Compute the intraday high, low, open, and close from a snapshot array.
 * Input should be ordered oldest-first (fetchedAt asc).
 */
export function computeDayOHLC(snapshots: GoldPriceSnapshot[]): {
  open:  number | null
  high:  number | null
  low:   number | null
  close: number | null
} {
  if (snapshots.length === 0) {
    return { open: null, high: null, low: null, close: null }
  }

  const prices = snapshots.map((s) => s.goldBarSell)
  return {
    open:  prices[0],
    close: prices[prices.length - 1],
    high:  Math.max(...prices),
    low:   Math.min(...prices),
  }
}
