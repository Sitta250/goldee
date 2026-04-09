/**
 * History page queries.
 *
 * Three functions, three concerns:
 *   getHistoryChartData  — downsampled time-series for the chart (all 4 metrics)
 *   getHistoryStats      — aggregate stats (max/min/first/last) for stat cards
 *   getHistoryTableRows  — paginated table, newest first, filtered by range
 *
 * Timestamp strategy (Feature 2):
 *   All queries prioritise capturedAt (source-native announcement time from YGTA)
 *   and fall back to fetchedAt (system ingest time) when capturedAt is null.
 *   This aligns /history with goldtraders.or.th/updatepricelist timestamps.
 *
 * Source strategy (Feature 1):
 *   Uses PRIMARY_HISTORY_SOURCE logic — rows with capturedAt are treated as
 *   authoritative YGTA announcements; rows without are ingest-time snapshots.
 *
 * Daily aggregation (Feature 6.5):
 *   7D / 30D  → up to 2 rows per Thai day (first then last announcement, 1 then N); same instant → 1 row.
 *   6M / 1Y   → 1 row per Thai calendar day (last/closing announcement of day).
 *   All       → no aggregation, plain DB-level pagination.
 *   Aggregated rows set `dayOrdinalDisplay` (1 / N within the Thai day) for the ครั้งที่ column.
 *   Days are delimited at midnight UTC+7. No prices are invented; all rows map
 *   directly to stored snapshots.
 *
 * Diagnostic logging (Feature 7):
 *   Set HISTORY_DEBUG=1 in environment to emit compact JSON-lines to stdout.
 */

import { db } from '@/lib/db'
import { canonicalTimestamp, timestampSourceLabel } from '@/lib/history/source-strategy'

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
  /** System ingest time — kept for backward compat and raw datetime attribute */
  fetchedAt:          Date
  /** Source-native announcement time from YGTA (null for non-YGTA rows) */
  capturedAt:         Date | null
  /**
   * Canonical display timestamp: capturedAt when available, fetchedAt as fallback.
   * All UI should use this field for display and comparison with YGTA table.
   */
  canonicalAt:        Date
  announcementNumber: string | null
  /**
   * 7D/30D/6M/1Y aggregated table only: within-Thai-day position — 1 = first announcement
   * that day, N = total announcements that day (the closing row shows N). Null for `All`.
   */
  dayOrdinalDisplay:  number | null
  goldBarBuy:         number
  goldBarSell:        number
  jewelryBuy:         number
  jewelrySell:        number
  source:             string
}

// ─── Diagnostic logging ───────────────────────────────────────────────────────

const HISTORY_DEBUG = process.env.HISTORY_DEBUG === '1'

function histLog(event: string, data: Record<string, unknown>) {
  if (!HISTORY_DEBUG) return
  console.log(JSON.stringify({ ts: new Date().toISOString(), ns: 'history', event, ...data }))
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns the earliest boundary for the given range, or null for 'All'. */
function getRangeStart(range: HistoryTimeframe): Date | null {
  if (range === 'All') return null
  const days = { '7D': 7, '30D': 30, '6M': 180, '1Y': 365 } as const
  return new Date(Date.now() - days[range] * 24 * 60 * 60 * 1_000)
}

/**
 * Builds a Prisma WHERE clause that filters by the canonical timestamp.
 *
 * Rows with capturedAt are filtered on capturedAt (source time).
 * Rows without capturedAt fall back to fetchedAt (ingest time).
 */
function buildRangeWhere(range: HistoryTimeframe) {
  const since = getRangeStart(range)
  if (!since) return {}

  return {
    OR: [
      { capturedAt: { gte: since } },
      { capturedAt: null, fetchedAt: { gte: since } },
    ],
  }
}

/**
 * Prisma orderBy that sorts by canonical timestamp, newest first.
 * capturedAt NULLs are placed last (they have no source-native time).
 */
const ORDER_CANONICAL_DESC = [
  { capturedAt: { sort: 'desc' as const, nulls: 'last' as const } },
  { fetchedAt: 'desc' as const },
]

/** Oldest-first equivalent for getHistoryStats first-row lookup. */
const ORDER_CANONICAL_ASC = [
  { capturedAt: { sort: 'asc' as const, nulls: 'last' as const } },
  { fetchedAt: 'asc' as const },
]

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = Math.ceil(arr.length / max)
  return arr.filter((_, i) => i % step === 0)
}

// ─── Daily aggregation helpers (Feature 6.5) ─────────────────────────────────

/** Thailand is UTC+7 year-round (no DST). */
const THAI_TZ_OFFSET_MS = 7 * 60 * 60 * 1_000

/**
 * Returns the Thai-timezone calendar day as a string "YYYY-MM-DD".
 * Pure arithmetic — no Intl/timezone libraries needed.
 */
function toThaiDay(date: Date): string {
  const thaiMs = date.getTime() + THAI_TZ_OFFSET_MS
  // Reuse ISO string generation on a shifted Date whose UTC value equals Thai local
  return new Date(thaiMs).toISOString().slice(0, 10)
}

type DailyAggMode = 'first_last' | 'last_only'

/**
 * Groups rows by Thai calendar day and applies per-timeframe aggregation.
 *
 * Input rows must be in newest-first order (ORDER_CANONICAL_DESC).
 * Output: newest Thai **calendar days** first; within each day (7D / 30D) rows are
 * chronological — ครั้งที่ 1 (opening) then ครั้งที่ N (closing).
 *
 * Rules:
 *   first_last (7D / 30D): emit [first_of_day, last_of_day] per day (1 then N).
 *     - If only one row exists that day, emit it once (never duplicated).
 *     - Same canonical timestamp for first/last → single row (duplicate ingests).
 *   last_only  (6M / 1Y):  emit only last_of_day per day.
 *
 * Sets `dayOrdinalDisplay`: N = bucket length on closing rows, 1 on opening row (7D/30D).
 *
 * No prices are computed or interpolated — all output rows are real stored rows.
 */
function withDayOrdinal(row: HistoryTableRow, ordinal: number): HistoryTableRow {
  return { ...row, dayOrdinalDisplay: ordinal }
}

/** Oldest-first; stable on id when timestamps tie. */
function compareHistoryRowChronoAsc(a: HistoryTableRow, b: HistoryTableRow): number {
  const t = a.canonicalAt.getTime() - b.canonicalAt.getTime()
  if (t !== 0) return t
  return a.id.localeCompare(b.id)
}

/** Bar sell of the snapshot immediately before the oldest row on this page (full aggregated list). */
function barSellBeforeOldestOnPage(
  aggregated: HistoryTableRow[],
  pageRows: HistoryTableRow[],
): number | null {
  if (pageRows.length === 0) return null
  const sortedAsc = [...aggregated].sort(compareHistoryRowChronoAsc)
  const oldestOnPage = [...pageRows].sort(compareHistoryRowChronoAsc)[0]
  const idx = sortedAsc.findIndex((r) => r.id === oldestOnPage.id)
  if (idx <= 0) return null
  return sortedAsc[idx - 1].goldBarSell
}

function aggregateByThaiDay(
  rows: HistoryTableRow[],
  mode: DailyAggMode,
): HistoryTableRow[] {
  // Build an ordered map: Thai day → rows in newest-first order
  const dayMap = new Map<string, HistoryTableRow[]>()
  for (const row of rows) {
    const day = toThaiDay(row.canonicalAt)
    const bucket = dayMap.get(day)
    if (bucket) {
      bucket.push(row)
    } else {
      dayMap.set(day, [row])
    }
  }

  // Days sorted newest-first
  const sortedDays = Array.from(dayMap.keys()).sort().reverse()

  const result: HistoryTableRow[] = []

  for (const day of sortedDays) {
    const bucket = dayMap.get(day)!  // newest-first within the day
    const n        = bucket.length
    const latest   = bucket[0]                        // chronologically last announcement
    const earliest = bucket[bucket.length - 1]        // chronologically first

    if (mode === 'last_only') {
      result.push(withDayOrdinal(latest, n))
      continue
    }

    // first_last — collapse when same row or same instant (duplicate snapshots)
    const sameInstant =
      latest.canonicalAt.getTime() === earliest.canonicalAt.getTime()

    if (latest.id === earliest.id || sameInstant) {
      result.push(withDayOrdinal(latest, n))
    } else {
      result.push(withDayOrdinal(earliest, 1))
      result.push(withDayOrdinal(latest, n))
    }
  }

  return result
}

// ─── DB select shape (shared across table query paths) ───────────────────────

const TABLE_SELECT = {
  id:                 true,
  fetchedAt:          true,
  capturedAt:         true,
  announcementNumber: true,
  goldBarBuy:         true,
  goldBarSell:        true,
  jewelryBuy:         true,
  jewelrySell:        true,
  source:             true,
} as const

function mapToTableRow(r: {
  id: string
  fetchedAt: Date
  capturedAt: Date | null
  announcementNumber: string | null
  goldBarBuy: { toNumber?: () => number } | number
  goldBarSell: { toNumber?: () => number } | number
  jewelryBuy: { toNumber?: () => number } | number
  jewelrySell: { toNumber?: () => number } | number
  source: string
}): HistoryTableRow {
  return {
    id:                 r.id,
    fetchedAt:          r.fetchedAt,
    capturedAt:         r.capturedAt,
    canonicalAt:        canonicalTimestamp(r),
    announcementNumber: r.announcementNumber,
    dayOrdinalDisplay:  null,
    goldBarBuy:         Number(r.goldBarBuy),
    goldBarSell:        Number(r.goldBarSell),
    jewelryBuy:         Number(r.jewelryBuy),
    jewelrySell:        Number(r.jewelrySell),
    source:             r.source,
  }
}

// ─── Chart data ───────────────────────────────────────────────────────────────

/**
 * Returns ≤200 chart points for the selected range.
 *
 * Note: preserved for backward compatibility. The /history page now uses
 * TradingView as the top chart and no longer calls this function.
 */
export async function getHistoryChartData(
  range: HistoryTimeframe,
): Promise<HistoryChartPoint[]> {
  const where = buildRangeWhere(range)

  const rows = await db.goldPriceSnapshot.findMany({
    where,
    orderBy: ORDER_CANONICAL_ASC,
    select: {
      fetchedAt:   true,
      capturedAt:  true,
      goldBarBuy:  true,
      goldBarSell: true,
      jewelryBuy:  true,
      jewelrySell: true,
    },
    take: 10_000,
  })

  const points = rows.map((r) => ({
    timestamp:   canonicalTimestamp(r).toISOString(),
    barBuy:      Number(r.goldBarBuy),
    barSell:     Number(r.goldBarSell),
    jewelryBuy:  Number(r.jewelryBuy),
    jewelrySell: Number(r.jewelrySell),
  }))

  return downsample(points, 200)
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

/**
 * Returns aggregate stats for the selected range.
 * Uses raw rows (not daily-aggregated) so max/min reflect the true period
 * extremes, not just day-boundary values.
 */
export async function getHistoryStats(
  range: HistoryTimeframe,
): Promise<HistoryStats> {
  const where = buildRangeWhere(range)

  const [agg, first, last] = await Promise.all([
    db.goldPriceSnapshot.aggregate({
      where,
      _max: { goldBarSell: true },
      _min: { goldBarSell: true },
    }),
    db.goldPriceSnapshot.findFirst({
      where,
      orderBy: ORDER_CANONICAL_ASC,
      select:  { goldBarSell: true, capturedAt: true, fetchedAt: true },
    }),
    db.goldPriceSnapshot.findFirst({
      where,
      orderBy: ORDER_CANONICAL_DESC,
      select:  { goldBarSell: true, capturedAt: true, fetchedAt: true },
    }),
  ])

  const latestBarSell = last  ? Number(last.goldBarSell)  : null
  const firstBarSell  = first ? Number(first.goldBarSell) : null
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

  histLog('stats', {
    range,
    latestBarSell,
    highBarSell,
    lowBarSell,
    changeAmount,
    latestTimestampSource: last ? timestampSourceLabel(last) : null,
    latestCanonicalAt:     last ? canonicalTimestamp(last).toISOString() : null,
  })

  return { latestBarSell, highBarSell, lowBarSell, changeAmount, changePercent }
}

// ─── Paginated table ──────────────────────────────────────────────────────────

/**
 * Newest-first paginated rows for the selected range.
 *
 * Daily aggregation (Feature 6.5) is applied for all ranges except 'All':
 *   7D / 30D  → at most 2 rows per Thai day (first + last announcement of day)
 *   6M / 1Y   → exactly 1 row per Thai day (closing/last announcement of day)
 *   All       → raw DB-level pagination, no aggregation
 *
 * For aggregated ranges the full range is fetched once, aggregated in memory,
 * then sliced to the requested page. The 'total' reflects aggregated row count.
 */
export async function getHistoryTableRows(
  page:    number,
  perPage: number,
  range:   HistoryTimeframe,
): Promise<{ rows: HistoryTableRow[]; total: number; olderRowBarSell: number | null }> {
  if (range === 'All') {
    return _allRangeTableRows(page, perPage)
  }
  return _aggregatedTableRows(page, perPage, range)
}

// ─── Table: 'All' range (DB-level pagination, no aggregation) ─────────────────

async function _allRangeTableRows(
  page:    number,
  perPage: number,
): Promise<{ rows: HistoryTableRow[]; total: number; olderRowBarSell: number | null }> {
  const [rawRows, total] = await db.$transaction([
    db.goldPriceSnapshot.findMany({
      orderBy: ORDER_CANONICAL_DESC,
      skip:    (page - 1) * perPage,
      take:    perPage + 1,
      select:  TABLE_SELECT,
    }),
    db.goldPriceSnapshot.count(),
  ])

  const olderRowBarSell = rawRows.length > perPage
    ? Number(rawRows[perPage].goldBarSell)
    : null

  const rows = rawRows.slice(0, perPage).map(mapToTableRow)

  histLog('table', {
    range: 'All', page, total,
    rowCount:              rows.length,
    aggregated:            false,
    latestCanonicalAt:     rows[0]?.canonicalAt.toISOString() ?? null,
    latestTimestampSource: rows[0] ? timestampSourceLabel(rows[0]) : null,
    latestBarSell:         rows[0]?.goldBarSell ?? null,
  })

  return { rows, total, olderRowBarSell }
}

// ─── Table: aggregated ranges (7D / 30D / 6M / 1Y) ───────────────────────────

/**
 * Fetch-all + in-memory daily aggregation + paginate.
 *
 * Row caps before aggregation (upper-bound estimates at ~30 announcements/day):
 *   7D  →  ~210 rows   30D  →  ~900 rows
 *   6M  →  ~5,400 rows  1Y  →  ~10,950 rows  (capped at 15,000)
 */
async function _aggregatedTableRows(
  page:    number,
  perPage: number,
  range:   Exclude<HistoryTimeframe, 'All'>,
): Promise<{ rows: HistoryTableRow[]; total: number; olderRowBarSell: number | null }> {
  const where = buildRangeWhere(range)
  const mode: DailyAggMode = (range === '6M' || range === '1Y') ? 'last_only' : 'first_last'

  // Fetch all rows for the range newest-first; 15k cap covers 1Y comfortably
  const rawRows = await db.goldPriceSnapshot.findMany({
    where,
    orderBy: ORDER_CANONICAL_DESC,
    take:    15_000,
    select:  TABLE_SELECT,
  })

  const allMapped = rawRows.map(mapToTableRow)
  const aggregated = aggregateByThaiDay(allMapped, mode)

  const total   = aggregated.length
  const start   = (page - 1) * perPage
  const pageRows = aggregated.slice(start, start + perPage)

  // Chrono predecessor of oldest row on page (display order is not time-sorted)
  const olderRowBarSell = barSellBeforeOldestOnPage(aggregated, pageRows)

  const newestOnPage = [...pageRows].sort(
    (a, b) => b.canonicalAt.getTime() - a.canonicalAt.getTime() || a.id.localeCompare(b.id),
  )[0]

  histLog('table', {
    range, page, total,
    mode,
    rawFetched:            rawRows.length,
    aggregatedTotal:       aggregated.length,
    rowCount:              pageRows.length,
    latestCanonicalAt:     newestOnPage?.canonicalAt.toISOString() ?? null,
    latestTimestampSource: newestOnPage ? timestampSourceLabel(newestOnPage) : null,
    latestBarSell:         newestOnPage?.goldBarSell ?? null,
  })

  return { rows: pageRows, total, olderRowBarSell }
}
