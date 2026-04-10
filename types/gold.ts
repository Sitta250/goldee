// ─── Raw price snapshot as stored in / returned from the database ─────────────
//
// Timestamp semantics (important for UI honesty):
//
//   fetchedAt   — when Goldee stored this row (first insert time).  Scheduled
//                 polling runs only during the Thai market window (default
//                 09:00–18:30 Asia/Bangkok), roughly every 5 minutes in that window.
//                 This is "when the app received" the row, not when the source
//                 changed the price.
//
//   lastSeenAt  — updated (without inserting a new row) on each successful poll
//                 that still sees the same price as the latest snapshot.
//                 Shows how recently the system re-confirmed that price.
//
//   capturedAt  — when the upstream source (e.g. YGTA / สมาคมค้าทองคำ) officially
//                 published or announced this price.  Null when the source does
//                 not expose a publication timestamp.  This is the most honest
//                 "price as-of" time to show users.
//
// UI contract:
//   Show capturedAt (labelled "เวลาประกาศ") when available.
//   Show fetchedAt  (labelled "รับข้อมูล")  always, as freshness indicator.
//   We poll only in session; YGTA typically announces ~09:00 and ~18:00 ICT.

export interface GoldPriceSnapshot {
  id:                 string
  fetchedAt:          Date
  lastSeenAt:         Date             // updated on dedup hits — no new row inserted
  capturedAt:         Date | null      // when officially announced by source
  source:             string           // short code: "ygta" | "seed" | "mock"
  sourceName:         string | null    // display name: "สมาคมค้าทองคำ"
  announcementNumber: string | null    // e.g. "68/0234"
  goldBarBuy:         number
  goldBarSell:        number
  jewelryBuy:         number
  jewelrySell:        number
  spotGoldUsd:        number | null    // world spot price USD/oz
  usdThb:             number | null    // exchange rate at time of snapshot
  notes:              string | null
}

// ─── Pre-computed change values attached to the latest snapshot ───────────────

export interface PriceChange {
  amount:    number              // Absolute delta (always positive)
  percent:   number              // Percentage (always positive)
  direction: 'up' | 'down' | 'flat'
}

// ─── Latest snapshot with change data — used on the homepage hero ─────────────

export interface LatestPriceData {
  snapshot: GoldPriceSnapshot
  change:   PriceChange
}

// ─── Condensed chart data point ───────────────────────────────────────────────

export interface ChartDataPoint {
  timestamp: string   // ISO string, formatted in the component
  barSell:   number
}

// ─── Timeframe options for the trend chart ────────────────────────────────────

export type Timeframe = '1D' | '7D' | '30D' | '6M' | '1Y'

// ─── Chart API response shape ─────────────────────────────────────────────────

export interface PriceHistoryResponse {
  range:  Timeframe
  points: ChartDataPoint[]
}

// ─── Daily summary ────────────────────────────────────────────────────────────

export interface DailySummary {
  id:           string
  date:         Date
  titleTh:      string
  summaryTh:    string
  reasonTh:     string | null
  openBarSell:  number | null
  closeBarSell: number | null
  highBarSell:  number | null
  lowBarSell:   number | null
  generatedAt:  Date
}

// ─── Calculator types ─────────────────────────────────────────────────────────

export type WeightUnit = 'baht' | 'gram'

/**
 * Gold purity options supported by the calculator.
 * Matches the PURITY_PRESETS array in GoldCalculator.tsx.
 */
export type PurityOption = 96.5 | 99.99 | 90 | 80 | 75 | 'custom'

export type TransactionType = 'buy' | 'sell'
