import { NextRequest, NextResponse } from 'next/server'
import { fetchGoldPrice } from '@/lib/gold/fetcher'
import { validateRawPrice } from '@/lib/gold/transformer'
import { db } from '@/lib/db'
import { upsertSourceStatus } from '@/lib/queries/settings'

// ─── Internal gold price fetch + store ───────────────────────────────────────
// Called only by /api/cron. Not meant to be called directly from the browser.
// Protected by the same CRON_SECRET.
//
// On success: inserts a GoldPriceSnapshot row + marks SourceStatus as 'ok'.
// On failure: marks SourceStatus as 'error' and returns 500.

export async function POST(req: NextRequest) {
  // ── Security check ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const secret     = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch from the external source (all source logic lives in fetcher.ts)
    const raw = await fetchGoldPrice()

    // 2. Validate before writing — throws on bad data
    validateRawPrice(raw)

    // 3. Write snapshot
    const snapshot = await db.goldPriceSnapshot.create({
      data: {
        source:             raw.source,
        sourceName:         raw.sourceName ?? null,
        announcementNumber: raw.announcementNumber ?? null,
        capturedAt:         raw.capturedAt ?? null,
        goldBarBuy:         raw.goldBarBuy,
        goldBarSell:        raw.goldBarSell,
        jewelryBuy:         raw.jewelryBuy,
        jewelrySell:        raw.jewelrySell,
        spotGoldUsd:        raw.spotGoldUsd ?? null,
        usdThb:             raw.usdThb ?? null,
        rawPayload:         raw.rawPayload,
      },
    })

    // 4. Update source health tracker
    await upsertSourceStatus(
      raw.source,
      raw.sourceName ?? raw.source,
      'ok',
      { lastSuccessPrice: raw.goldBarSell },
    )

    return NextResponse.json({
      ok: true,
      snapshot: {
        id:          snapshot.id,
        fetchedAt:   snapshot.fetchedAt,
        goldBarSell: Number(snapshot.goldBarSell),
        source:      snapshot.source,
      },
    })
  } catch (err) {
    const message = (err as Error).message
    console.error('[gold/fetch] error:', message)

    // Record the failure in source_status so we can detect prolonged outages
    try {
      // TODO: pass the actual source name once we know it (before the fetch fails)
      await upsertSourceStatus('unknown', 'Unknown Source', 'error', { errorMessage: message })
    } catch {
      // Don't let status tracking errors shadow the original error
    }

    return NextResponse.json(
      { error: 'Failed to fetch or store gold price', message },
      { status: 500 },
    )
  }
}
