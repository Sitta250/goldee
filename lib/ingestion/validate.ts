import type { NormalizedGoldPrice } from './types'

// Realistic bounds for Thai gold (THB per 1 baht-weight).
// If a price lands outside these, the parser is broken — don't write garbage to the DB.
const PRICE_MIN = 5_000
const PRICE_MAX = 999_999

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validates a NormalizedGoldPrice and returns a lightly normalised copy.
 * Throws ValidationError (non-retryable) if any value is out of range or
 * logically inconsistent.
 *
 * Normalisation applied:
 *   - All price fields rounded to 2 decimal places
 *   - No other mutations — caller's object is not modified
 */
export function validateAndNormalize(price: NormalizedGoldPrice): NormalizedGoldPrice {
  const requiredPrices = [
    ['barBuy',      price.barBuy],
    ['barSell',     price.barSell],
    ['jewelryBuy',  price.jewelryBuy],
    ['jewelrySell', price.jewelrySell],
  ] as const

  // 1. All four price fields must be positive finite numbers
  for (const [field, val] of requiredPrices) {
    if (typeof val !== 'number' || !isFinite(val) || val <= 0) {
      throw new ValidationError(
        `"${field}" must be a positive finite number, got: ${JSON.stringify(val)}`,
      )
    }
  }

  // 2. Prices must be within the Thai gold market's expected range
  for (const [field, val] of requiredPrices) {
    if (val < PRICE_MIN || val > PRICE_MAX) {
      throw new ValidationError(
        `"${field}" = ${val} is outside the expected Thai gold price range ` +
        `[${PRICE_MIN.toLocaleString()}, ${PRICE_MAX.toLocaleString()}] THB`,
      )
    }
  }

  // 3. Spread must be positive: buy price < sell price
  if (price.barBuy >= price.barSell) {
    throw new ValidationError(
      `barBuy (${price.barBuy}) must be less than barSell (${price.barSell}) — ` +
      `spread is zero or negative`,
    )
  }
  if (price.jewelryBuy >= price.jewelrySell) {
    throw new ValidationError(
      `jewelryBuy (${price.jewelryBuy}) must be less than jewelrySell (${price.jewelrySell}) — ` +
      `spread is zero or negative`,
    )
  }

  // 4. Optional: spot gold sanity check (USD per troy oz, realistic range)
  if (price.spotGoldUsd != null) {
    if (!isFinite(price.spotGoldUsd) || price.spotGoldUsd <= 0 || price.spotGoldUsd > 100_000) {
      throw new ValidationError(
        `spotGoldUsd = ${price.spotGoldUsd} is not a valid spot price (expected 0–100,000 USD/oz)`,
      )
    }
  }

  // 5. Optional: USD/THB sanity check
  if (price.usdThb != null) {
    if (!isFinite(price.usdThb) || price.usdThb <= 0 || price.usdThb > 10_000) {
      throw new ValidationError(
        `usdThb = ${price.usdThb} is not a valid exchange rate (expected 0–10,000)`,
      )
    }
  }

  // Return a normalised copy — round prices to 2 dp
  return {
    ...price,
    barBuy:      round2(price.barBuy),
    barSell:     round2(price.barSell),
    jewelryBuy:  round2(price.jewelryBuy),
    jewelrySell: round2(price.jewelrySell),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
