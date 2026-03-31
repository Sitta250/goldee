import { db } from '@/lib/db'
import type { Timeframe, ChartDataPoint, GoldPriceSnapshot, DailySummary } from '@/types/gold'

// ─── Prisma Decimal → number ──────────────────────────────────────────────────
// Prisma returns Decimal objects for DECIMAL columns. We normalise to number
// at the query boundary so the rest of the app deals only with plain numbers.

function n(v: object | null | undefined): number | null {
  return v == null ? null : Number(v)
}

function toSnapshot(row: {
  id: string
  fetchedAt: Date
  capturedAt: Date | null
  source: string
  sourceName: string | null
  announcementNumber: string | null
  goldBarBuy: object
  goldBarSell: object
  jewelryBuy: object
  jewelrySell: object
  spotGoldUsd: object | null
  usdThb: object | null
  notes: string | null
}): GoldPriceSnapshot {
  return {
    id:                 row.id,
    fetchedAt:          row.fetchedAt,
    capturedAt:         row.capturedAt,
    source:             row.source,
    sourceName:         row.sourceName,
    announcementNumber: row.announcementNumber,
    goldBarBuy:         Number(row.goldBarBuy),
    goldBarSell:        Number(row.goldBarSell),
    jewelryBuy:         Number(row.jewelryBuy),
    jewelrySell:        Number(row.jewelrySell),
    spotGoldUsd:        n(row.spotGoldUsd),
    usdThb:             n(row.usdThb),
    notes:              row.notes,
  }
}

// Fields we select for full snapshot rows (omits rawPayload to keep payloads lean)
const snapshotSelect = {
  id: true, fetchedAt: true, capturedAt: true,
  source: true, sourceName: true, announcementNumber: true,
  goldBarBuy: true, goldBarSell: true,
  jewelryBuy: true, jewelrySell: true,
  spotGoldUsd: true, usdThb: true,
  notes: true,
} as const

// ─── Snapshot queries ─────────────────────────────────────────────────────────

/** The single most recent price snapshot */
export async function getLatestSnapshot(): Promise<GoldPriceSnapshot | null> {
  const row = await db.goldPriceSnapshot.findFirst({
    orderBy: { fetchedAt: 'desc' },
    select:  snapshotSelect,
  })
  return row ? toSnapshot(row) : null
}

/** The snapshot immediately before the latest — used to calculate price change */
export async function getPreviousSnapshot(): Promise<GoldPriceSnapshot | null> {
  const rows = await db.goldPriceSnapshot.findMany({
    orderBy: { fetchedAt: 'desc' },
    take:    2,
    select:  snapshotSelect,
  })
  return rows.length > 1 ? toSnapshot(rows[1]) : null
}

/** Latest N snapshots — for small in-page tables */
export async function getRecentSnapshots(limit = 10): Promise<GoldPriceSnapshot[]> {
  const rows = await db.goldPriceSnapshot.findMany({
    orderBy: { fetchedAt: 'desc' },
    take:    limit,
    select:  snapshotSelect,
  })
  return rows.map(toSnapshot)
}

/** Paginated snapshots for the price history table */
export async function getPaginatedSnapshots(
  page:    number,
  perPage = 30,
): Promise<{ rows: GoldPriceSnapshot[]; total: number }> {
  const [rows, total] = await db.$transaction([
    db.goldPriceSnapshot.findMany({
      orderBy: { fetchedAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select:  snapshotSelect,
    }),
    db.goldPriceSnapshot.count(),
  ])
  return { rows: rows.map(toSnapshot), total }
}

/** Snapshots within a timeframe — powers the trend chart */
export async function getSnapshotsByRange(range: Timeframe): Promise<ChartDataPoint[]> {
  const since = getRangeStart(range)

  const rows = await db.goldPriceSnapshot.findMany({
    where:   { fetchedAt: { gte: since } },
    orderBy: { fetchedAt: 'asc' },
    select:  { fetchedAt: true, goldBarSell: true },
  })

  const points = rows.map((r) => ({
    timestamp: r.fetchedAt.toISOString(),
    barSell:   Number(r.goldBarSell),
  }))

  // Downsample to ≤200 points for long timeframes so the chart stays readable
  return downsample(points, 200)
}

// ─── Daily summary queries ────────────────────────────────────────────────────

function toDailySummary(row: {
  id: string
  date: Date
  titleTh: string
  summaryTh: string
  reasonTh: string | null
  openBarSell:  object | null
  closeBarSell: object | null
  highBarSell:  object | null
  lowBarSell:   object | null
  generatedAt:  Date
}): DailySummary {
  return {
    id:           row.id,
    date:         row.date,
    titleTh:      row.titleTh,
    summaryTh:    row.summaryTh,
    reasonTh:     row.reasonTh,
    openBarSell:  n(row.openBarSell),
    closeBarSell: n(row.closeBarSell),
    highBarSell:  n(row.highBarSell),
    lowBarSell:   n(row.lowBarSell),
    generatedAt:  row.generatedAt,
  }
}

/** Today's daily summary — for the homepage card */
export async function getTodaySummary(): Promise<DailySummary | null> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const row = await db.dailySummary.findUnique({
    where: { date: today },
  })
  return row ? toDailySummary(row) : null
}

/** Latest daily summary (today or most recent past) */
export async function getLatestSummary(): Promise<DailySummary | null> {
  const row = await db.dailySummary.findFirst({
    orderBy: { date: 'desc' },
  })
  return row ? toDailySummary(row) : null
}

/** All daily summaries — for an admin view or future analytics */
export async function getAllSummaries(): Promise<DailySummary[]> {
  const rows = await db.dailySummary.findMany({
    orderBy: { date: 'desc' },
  })
  return rows.map(toDailySummary)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getRangeStart(range: Timeframe): Date {
  const now = new Date()
  const ms  = (days: number) => days * 24 * 60 * 60 * 1_000
  switch (range) {
    case '1D':  return new Date(now.getTime() - ms(1))
    case '7D':  return new Date(now.getTime() - ms(7))
    case '30D': return new Date(now.getTime() - ms(30))
    case '6M':  return new Date(now.getTime() - ms(180))
    case '1Y':  return new Date(now.getTime() - ms(365))
  }
}

function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  return arr.filter((_, i) => i % step === 0)
}
