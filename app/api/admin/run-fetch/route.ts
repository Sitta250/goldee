import { NextRequest, NextResponse } from 'next/server'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'

// ─── Manual ingestion trigger — /api/admin/run-fetch ─────────────────────────
//
// Secured with the same CRON_SECRET as the cron endpoint.
// Works in local dev, staging, and production — unlike /api/gold/trigger which
// is blocked by NODE_ENV guard.
//
// Use this when you want to manually fire ingestion without waiting for cron:
//
//   Local dev:
//     curl -H "Authorization: Bearer <your-CRON_SECRET>" \
//          http://localhost:3000/api/admin/run-fetch
//
//   Production (manual re-fetch after an outage, for example):
//     curl -H "Authorization: Bearer <your-CRON_SECRET>" \
//          https://yourdomain.com/api/admin/run-fetch
//
// Response shape matches /api/cron/fetch-gold-price for consistency:
//   { ok, status, timestamp, durationMs, ...result fields }

export async function GET(req: NextRequest) {
  const start  = Date.now()
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization')

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not set in environment variables.' },
      { status: 500 },
    )
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // ── Run ingestion ────────────────────────────────────────────────────────────
  console.info('[admin/run-fetch] Manual ingestion triggered')
  const result     = await ingestGoldPrice()
  const durationMs = Date.now() - start

  // ── Response ─────────────────────────────────────────────────────────────────
  if (result.status === 'error') {
    console.error(`[admin/run-fetch] error — ${result.error}`)
    return NextResponse.json(
      {
        ok:        false,
        status:    'error',
        error:     result.error,
        timestamp: new Date().toISOString(),
        durationMs,
      },
      { status: 500 },
    )
  }

  if (result.status === 'skipped') {
    return NextResponse.json({
      ok:        true,
      status:    'skipped',
      reason:    result.reason,
      timestamp: new Date().toISOString(),
      durationMs,
    })
  }

  // status === 'inserted'
  return NextResponse.json({
    ok:         true,
    status:     'inserted',
    snapshotId: result.snapshotId,
    barSell:    result.barSell,
    timestamp:  new Date().toISOString(),
    durationMs,
  })
}
