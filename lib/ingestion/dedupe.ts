import { db } from '@/lib/db'
import type { NormalizedGoldPrice } from './types'

export interface DedupeCheckResult {
  isDuplicate:      boolean
  latestSnapshotId: string | null
  reason?:          string
}

/**
 * Checks whether the incoming price is a duplicate of the most recent stored snapshot.
 *
 * Duplicate rules (all must be satisfied):
 *   1. All four prices match (barBuy, barSell, jewelryBuy, jewelrySell)
 *   2. If both have an announcement number, those must match too.
 *      If either side is missing an announcement number, prices alone decide.
 *
 * Special case: same prices but different announcement numbers → NOT a duplicate.
 * This handles the rare case where YGTA re-announces at the same price level.
 */
export async function checkDuplicate(
  incoming:   NormalizedGoldPrice,
  sourceCode: string,
): Promise<DedupeCheckResult> {
  const latest = await db.goldPriceSnapshot.findFirst({
    where:   { source: sourceCode },
    orderBy: { fetchedAt: 'desc' },
    select: {
      id:                true,
      goldBarBuy:        true,
      goldBarSell:       true,
      jewelryBuy:        true,
      jewelrySell:       true,
      announcementNumber:true,
    },
  })

  if (!latest) {
    return { isDuplicate: false, latestSnapshotId: null }
  }

  const pricesMatch =
    incoming.barBuy      === Number(latest.goldBarBuy)  &&
    incoming.barSell     === Number(latest.goldBarSell) &&
    incoming.jewelryBuy  === Number(latest.jewelryBuy)  &&
    incoming.jewelrySell === Number(latest.jewelrySell)

  if (!pricesMatch) {
    return { isDuplicate: false, latestSnapshotId: latest.id }
  }

  // Prices match. Use announcement number as tie-breaker when both sides have one.
  if (incoming.announcementNumber && latest.announcementNumber) {
    if (incoming.announcementNumber !== latest.announcementNumber) {
      // New announcement at the same price — treat as a real new snapshot
      return {
        isDuplicate:      false,
        latestSnapshotId: latest.id,
        reason:
          `Same prices but new announcement number ` +
          `(${latest.announcementNumber} → ${incoming.announcementNumber})`,
      }
    }
  }

  return {
    isDuplicate:      true,
    latestSnapshotId: latest.id,
    reason:           'All four prices match the most recent snapshot',
  }
}

/**
 * Update lastSeenAt on an existing snapshot without inserting a new row.
 * Called when a duplicate is detected so we know when a price was last observed.
 */
export async function touchLastSeenAt(snapshotId: string): Promise<void> {
  await db.goldPriceSnapshot.update({
    where: { id: snapshotId },
    data:  { lastSeenAt: new Date() },
  })
}
