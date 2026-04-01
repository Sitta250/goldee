import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { upsertSourceStatus } from '@/lib/queries/settings'
import { checkDuplicate, touchLastSeenAt } from './dedupe'
import { insertSnapshot } from './persist'
import type { IngestionResult, NormalizedGoldPrice } from './types'
import { validateAndNormalize, ValidationError } from './validate'

export interface NormalizedIngestPayload {
  source: string
  asTime: string
  seq: string
  barBuy: number
  barSell: number
  ornamentBuy: number
  ornamentSell: number
  fetchedAt: string
}

export async function ingestNormalizedPayload(
  payload: NormalizedIngestPayload,
): Promise<IngestionResult> {
  const source = payload.source.trim().toLowerCase()
  const capturedAt = new Date(payload.asTime)
  const fetchedAt = new Date(payload.fetchedAt)

  const normalized: NormalizedGoldPrice = validateAndNormalize({
    sourceName: source,
    announcementNumber: payload.seq.trim(),
    capturedAt: Number.isNaN(capturedAt.getTime()) ? null : capturedAt,
    barBuy: payload.barBuy,
    barSell: payload.barSell,
    jewelryBuy: payload.ornamentBuy,
    jewelrySell: payload.ornamentSell,
    spotGoldUsd: null,
    usdThb: null,
    notes: null,
  })

  try {
    const existingByProviderId = normalized.capturedAt
      ? await db.goldPriceSnapshot.findFirst({
          where: {
            source,
            announcementNumber: normalized.announcementNumber,
            capturedAt: normalized.capturedAt,
          },
          select: { id: true },
        })
      : null

    if (existingByProviderId) {
      await touchLastSeenAt(existingByProviderId.id)
      await upsertSourceStatus(source, source, 'ok', { lastSuccessPrice: normalized.barSell })
      return {
        status: 'skipped',
        reason: 'Duplicate provider identity (source + seq + asTime)',
        isDuplicate: true,
      }
    }

    const dedupe = await checkDuplicate(normalized, source)
    if (dedupe.isDuplicate && dedupe.latestSnapshotId) {
      await touchLastSeenAt(dedupe.latestSnapshotId)
      await upsertSourceStatus(source, source, 'ok', { lastSuccessPrice: normalized.barSell })
      return {
        status: 'skipped',
        reason: dedupe.reason ?? 'All four prices match the most recent snapshot',
        isDuplicate: true,
      }
    }

    const snapshot = await insertSnapshot(normalized, source, { fetchedAt })
    await upsertSourceStatus(source, source, 'ok', { lastSuccessPrice: snapshot.goldBarSell })

    return {
      status: 'inserted',
      snapshotId: snapshot.id,
      barSell: snapshot.goldBarSell,
      isDuplicate: false,
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      return { status: 'error', error: err.message, isDuplicate: false }
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        status: 'skipped',
        reason: 'Duplicate provider identity (DB unique constraint)',
        isDuplicate: true,
      }
    }

    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', error: message, isDuplicate: false }
  }
}
