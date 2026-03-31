import type { GoldPriceSnapshot, PriceChange } from '@/types/gold'

// ─── Trend calculation utilities ──────────────────────────────────────────────

/**
 * Calculate the change between two price snapshots based on the gold bar sell price.
 * Returns absolute delta, percentage, and direction.
 */
export function calculateChange(
  latest: GoldPriceSnapshot,
  previous: GoldPriceSnapshot | null,
): PriceChange {
  if (!previous) {
    return { amount: 0, percent: 0, direction: 'flat' }
  }

  const delta = latest.goldBarSell - previous.goldBarSell

  const percent =
    previous.goldBarSell !== 0
      ? (delta / previous.goldBarSell) * 100
      : 0

  const direction: PriceChange['direction'] =
    delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'

  return {
    amount: Math.abs(delta),
    percent: Math.abs(percent),
    direction,
  }
}

/**
 * Determine the overall direction of an array of gold bar sell prices.
 * Used for the daily summary card.
 */
export function getDayDirection(
  prices: number[],
): 'up' | 'down' | 'flat' {
  if (prices.length < 2) return 'flat'
  const first = prices[0]
  const last = prices[prices.length - 1]
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'flat'
}

/**
 * Calculate value of gold by weight.
 * @param weightBaht - weight in baht-unit (1 baht = 15.244 grams)
 * @param purityPercent - e.g. 96.5 for standard gold bar
 * @param pricePerBaht - price in THB for 1 baht-weight of 96.5% gold
 */
export function calculateGoldValue(
  weightBaht: number,
  purityPercent: number,
  pricePerBaht: number,
): number {
  return weightBaht * (purityPercent / 96.5) * pricePerBaht
}

/** Convert grams to baht-weight units */
export function gramsToBaht(grams: number): number {
  return grams / 15.244
}

/** Convert baht-weight units to grams */
export function bahtToGrams(baht: number): number {
  return baht * 15.244
}
