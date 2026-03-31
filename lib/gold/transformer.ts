// ─── Gold price transformer ───────────────────────────────────────────────────
// Normalises raw API payloads from different sources into a consistent shape.
// When you swap the data source, only the fetcher + the relevant transform
// function below needs to change. No other file is affected.

import type { RawGoldPrice } from './fetcher'

// ─── Example: YGTA (ราคาทองคำสมาคมฯ) response shape ─────────────────────────
// TODO: Update this interface to match the actual API response when confirmed.
interface YgtaApiResponse {
  buy_bar:      number
  sell_bar:     number
  buy_jewelry:  number
  sell_jewelry: number
  updated_at:   string
}

export function transformYgta(raw: YgtaApiResponse): RawGoldPrice {
  return {
    goldBarBuy:  raw.buy_bar,
    goldBarSell: raw.sell_bar,
    jewelryBuy:  raw.buy_jewelry,
    jewelrySell: raw.sell_jewelry,
    source:      'ygta',
    rawPayload:  raw as unknown as Record<string, unknown>,
  }
}

// ─── Validation helper ────────────────────────────────────────────────────────
// Ensures that prices are positive numbers before we write to the database.

export function validateRawPrice(price: RawGoldPrice): void {
  const fields: Array<keyof RawGoldPrice> = [
    'goldBarBuy',
    'goldBarSell',
    'jewelryBuy',
    'jewelrySell',
  ]

  for (const field of fields) {
    const val = price[field]
    if (typeof val !== 'number' || val <= 0 || !isFinite(val)) {
      throw new Error(`Invalid price value for field "${field}": ${val}`)
    }
  }
}
