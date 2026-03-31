/**
 * History page queries.
 *
 * Three functions, three concerns:
 *   getHistoryChartData  — downsampled time-series for the chart (all 4 metrics)
 *   getHistoryStats      — aggregate stats (max/min/first/last) for stat cards
 *   getHistoryTableRows  — paginated table, newest first, filtered by range
 *
 * Designed for future aggregation:
 *   When you add hourly/daily aggregate tables, replace the body of
 *   getHistoryChartData() for older ranges ('6M', '1Y', 'All') without
 *   touching any component code — the output shape stays identical.
 */

import { db } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HistoryTimeframe = '7D' | '30D' | '6M' | '1Y' | 'All'
export type MetricKey = 'barSell' | 'barBuy' | 'jewelrySell' | 'jewelryBuy'

export interface HistoryChartPoint {
  timestamp:   string   // ISO — formatted by the chart component
  barBuy:      number
  barSell:     number
  jewelryBuy:  number
  jewelrySell: number
}

export interface HistoryStats {
  latestBarSell:  number | null
  highBarSell:    number | null
  lowBarSell:     number | null
  changeAmount:   number | null   // latest − first, signed
  changePercent:  number | null   // signed percentage
}

export interface HistoryTableRow {
  id:                 string
  fetchedAt:          Date
  announcementNumber: string | null
  goldBarBuy:         number
  goldBarSell:        number
  jewelryBuy:         number
  jewelrySell:        number
  source:             string
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns the earliest fetchedAt for the given range, or null for 'All'. */
function getRangeStart(range: HistoryTimeframe): Date | null {
  if (range === 'All') return null
  const days = { '7D': 7, '30D': 30, '6M': 180, '1Y': 365 } as const
  return new Date(Date.now() - days[range] * 24 * 60 * 60 * 1_000)
}

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = Math.ceil(arr.length / max)
  return arr.filter((_, i) => i % step === 0)
}

// ─── Chart data ───────────────────────────────────────────────────────────────

/**
 * Returns ≤200 chart points for the selected range.
 *
 * All 4 price columns are included so the metric toggle (barSell / barBuy /
 * jewelrySell / jewelryBuy) works purely client-side with no extra fetch.
 *
 * Future optimisation path:
 *   For '6M'/'1Y'/'All', replace the findMany below with a query against
 *   a pre-aggregated hourly/daily table — the output shape is unchanged.
 */
export async function getHistoryChartData(
  range: HistoryTimeframe,
): Promise<HistoryChartPoint[]> {
  const since = getRangeStart(range)

  const rows = await db.goldPriceSnapshot.findMany({
    where:   since ? { fetchedAt: { gte: since } } : undefined,
    orderBy: { fetchedAt: 'asc' },
    select:  {
      fetchedAt:   true,
      goldBarBuy:  true,
      goldBarSell: true,
      jewelryBuy:  true,
      jewelrySell: true,
    },
    // Soft cap before downsampling — avoids loading millions of rows for 'All'
    take: 10_000,
  })

  const points = rows.map((r) => ({
    timestamp:   r.fetchedAt.toISOString(),
    barBuy:      Number(r.goldBarBuy),
    barSell:     Number(r.goldBarSell),
    jewelryBuy:  Number(r.jewelryBuy),
    jewelrySell: Number(r.jewelrySell),
  }))

  return downsample(points, 200)
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

/**
 * Returns aggregate stats for the selected range using two efficient queries:
 *   1. Prisma aggregate for MAX/MIN (single SQL aggregate)
 *   2. findFirst ×2 for first and last row in the period
 *
 * All run in parallel.
 */
export async function getHistoryStats(
  range: HistoryTimeframe,
): Promise<HistoryStats> {
  const since = getRangeStart(range)
  const where = since ? { fetchedAt: { gte: since } } : {}

  const [agg, first, last] = await Promise.all([
    db.goldPriceSnapshot.aggregate({
      where,
      _max: { goldBarSell: true },
      _min: { goldBarSell: true },
    }),
    db.goldPriceSnapshot.findFirst({
      where,
      orderBy: { fetchedAt: 'asc' },
      select:  { goldBarSell: true },
    }),
    db.goldPriceSnapshot.findFirst({
      where,
      orderBy: { fetchedAt: 'desc' },
      select:  { goldBarSell: true },
    }),
  ])

  const latestBarSell = last  ? Number(last.goldBarSell)       : null
  const firstBarSell  = first ? Number(first.goldBarSell)      : null
  const highBarSell   = agg._max.goldBarSell ? Number(agg._max.goldBarSell) : null
  const lowBarSell    = agg._min.goldBarSell ? Number(agg._min.goldBarSell) : null

  const changeAmount =
    latestBarSell !== null && firstBarSell !== null
      ? latestBarSell - firstBarSell
      : null

  const changePercent =
    changeAmount !== null && firstBarSell !== null && firstBarSell !== 0
      ? (changeAmount / firstBarSell) * 100
      : null

  return { latestBarSell, highBarSell, lowBarSell, changeAmount, changePercent }
}

// ─── Paginated table ──────────────────────────────────────────────────────────

/** Newest-first paginated rows for the selected range. */
export async function getHistoryTableRows(
  page:    number,
  perPage: number,
  range:   HistoryTimeframe,
): Promise<{ rows: HistoryTableRow[]; total: number }> {
  const since = getRangeStart(range)
  const where = since ? { fetchedAt: { gte: since } } : {}

  const [rows, total] = await db.$transaction([
    db.goldPriceSnapshot.findMany({
      where,
      orderBy: { fetchedAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select:  {
        id:                 true,
        fetchedAt:          true,
        announcementNumber: true,
        goldBarBuy:         true,
        goldBarSell:        true,
        jewelryBuy:         true,
        jewelrySell:        true,
        source:             true,
      },
    }),
    db.goldPriceSnapshot.count({ where }),
  ])

  return {
    rows: rows.map((r) => ({
      id:                 r.id,
      fetchedAt:          r.fetchedAt,
      announcementNumber: r.announcementNumber,
      goldBarBuy:         Number(r.goldBarBuy),
      goldBarSell:        Number(r.goldBarSell),
      jewelryBuy:         Number(r.jewelryBuy),
      jewelrySell:        Number(r.jewelrySell),
      source:             r.source,
    })),
    total,
  }
}
