// ─── Gold price transformer ───────────────────────────────────────────────────
// Normalises raw API payloads from different sources into a consistent shape.
// When you swap the data source, only the fetcher + the relevant transform
// function below needs to change. No other file is affected.

import type { RawGoldPrice } from './types'

// ─── YGTA (goldtraders.or.th) response shape ─────────────────────────────────
// Actual shape from https://www.goldtraders.or.th/api/GoldPrices/Latest?readjson=false
interface YgtaApiResponse {
  goldPriceID:              number
  asTime:                   string   // e.g. "2026-04-09T13:39:00"
  seq:                      number
  priceSeq:                 number
  bL_BuyPrice:              number   // gold bar buy  (THB per 1 baht-weight)
  bL_SellPrice:             number   // gold bar sell (THB per 1 baht-weight)
  oM965_BuyPrice:           number   // 96.5% jewelry buy  (THB per 1 baht-weight)
  oM965_SellPrice:          number   // 96.5% jewelry sell (THB per 1 baht-weight)
  oM965_BuyGPrice:          number   // 96.5% jewelry buy  (THB per gram)
  goldSpot:                 number   // spot gold (THB per gram)
  bahtPerUSD:               number   // USD → THB exchange rate
  priceChangeFromPrevRow:   number
  priceChangeFromPrevDayLast: number
  [key: string]:            unknown
}

export function transformYgta(raw: YgtaApiResponse): RawGoldPrice {
  return {
    goldBarBuy:         raw.bL_BuyPrice,
    goldBarSell:        raw.bL_SellPrice,
    jewelryBuy:         raw.oM965_BuyPrice,
    jewelrySell:        raw.oM965_SellPrice,
    capturedAt:         new Date(raw.asTime),
    announcementNumber: String(raw.seq),
    source:             'ygta',
    sourceName:         'สมาคมค้าทองคำ',
    usdThb:             raw.bahtPerUSD,
    rawPayload:         raw as unknown as Record<string, unknown>,
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
