import { db }     from '@/lib/db'
import { Prisma }  from '@prisma/client'
import type { NormalizedGoldPrice } from './types'
import type { GoldPriceSnapshot }   from '@/types/gold'

/**
 * Insert a new GoldPriceSnapshot row.
 *
 * Design notes:
 *
 * rawPayload is intentionally left as SQL NULL (Prisma.JsonNull).
 *   We do not store raw HTML, full API responses, or large debug payloads in this
 *   table. If you need a raw response audit trail, write it to a separate table or
 *   external log sink — not here. The field exists in the schema for future use only.
 *
 * lastSeenAt is initialised to fetchedAt on insert.
 *   It is bumped (without a new row) by touchLastSeenAt() on duplicate hits.
 *   The window [fetchedAt → lastSeenAt] tells a future downsampler how many cron
 *   cycles this single row represents, making it safe to delete intermediate rows
 *   without losing coverage information.
 *
 * Downsampling compatibility:
 *   Chart and history queries use fetchedAt range filters. As long as at least one
 *   row per target granularity (e.g. one per hour) is kept, those queries continue
 *   to work correctly after any downsampling run.
 */
export async function insertSnapshot(
  price:      NormalizedGoldPrice,
  sourceCode: string,
): Promise<GoldPriceSnapshot> {
  const now = new Date()

  const row = await db.goldPriceSnapshot.create({
    data: {
      fetchedAt:          now,
      lastSeenAt:         now,
      source:             sourceCode,
      sourceName:         price.sourceName,
      announcementNumber: price.announcementNumber,
      capturedAt:         price.capturedAt,
      goldBarBuy:         price.barBuy,
      goldBarSell:        price.barSell,
      jewelryBuy:         price.jewelryBuy,
      jewelrySell:        price.jewelrySell,
      spotGoldUsd:        price.spotGoldUsd ?? null,
      usdThb:             price.usdThb      ?? null,
      notes:              price.notes,
      rawPayload:         Prisma.JsonNull,  // reserved for future use — never populated
    },
    select: snapshotSelect,
  })

  return rowToSnapshot(row)
}

// ─── Shared select + mapper ───────────────────────────────────────────────────
// Omits rawPayload from every query to keep response payloads lean.

export const snapshotSelect = {
  id: true, fetchedAt: true, lastSeenAt: true, capturedAt: true,
  source: true, sourceName: true, announcementNumber: true,
  goldBarBuy: true, goldBarSell: true,
  jewelryBuy: true, jewelrySell: true,
  spotGoldUsd: true, usdThb: true,
  notes: true,
} as const

type SnapshotRow = {
  id:                 string
  fetchedAt:          Date
  lastSeenAt:         Date
  capturedAt:         Date | null
  source:             string
  sourceName:         string | null
  announcementNumber: string | null
  goldBarBuy:         object
  goldBarSell:        object
  jewelryBuy:         object
  jewelrySell:        object
  spotGoldUsd:        object | null
  usdThb:             object | null
  notes:              string | null
}

export function rowToSnapshot(row: SnapshotRow): GoldPriceSnapshot {
  return {
    id:                 row.id,
    fetchedAt:          row.fetchedAt,
    lastSeenAt:         row.lastSeenAt,
    capturedAt:         row.capturedAt,
    source:             row.source,
    sourceName:         row.sourceName,
    announcementNumber: row.announcementNumber,
    goldBarBuy:         Number(row.goldBarBuy),
    goldBarSell:        Number(row.goldBarSell),
    jewelryBuy:         Number(row.jewelryBuy),
    jewelrySell:        Number(row.jewelrySell),
    spotGoldUsd:        row.spotGoldUsd != null ? Number(row.spotGoldUsd) : null,
    usdThb:             row.usdThb      != null ? Number(row.usdThb)      : null,
    notes:              row.notes,
  }
}
