import { NextRequest, NextResponse } from 'next/server'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'

// ─── Vercel Cron endpoint — /api/cron/fetch-gold-price ───────────────────────
//
// Triggered automatically by Vercel every 5 minutes in production.
// Configured in vercel.json:
//   { "path": "/api/cron/fetch-gold-price", "schedule": "*/5 * * * *" }
//
// ⚠️  Vercel Cron only runs on Production deployments.
//     Preview deployments and localhost do NOT receive cron calls.
//     Use /api/admin/run-fetch (with Authorization header) for manual testing.
//
// Security:
//   Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on every
//   cron invocation. We verify it here so the endpoint cannot be called without
//   the secret — even if someone discovers the URL.
//
// Response shape (all cases):
//   { ok, status, timestamp, durationMs, ...result-specific fields }

export async function GET(req: NextRequest) {
  const start  = Date.now()
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization')

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (!secret || auth !== `Bearer ${secret}`) {
    console.warn('[cron/fetch-gold-price] Unauthorized request rejected')
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // ── Run ingestion ────────────────────────────────────────────────────────────
  console.info('[cron/fetch-gold-price] Starting ingestion cycle')
  const result = await ingestGoldPrice()
  const durationMs = Date.now() - start

  // ── Log outcome ──────────────────────────────────────────────────────────────
  if (result.status === 'error') {
    console.error(
      `[cron/fetch-gold-price] error after ${durationMs}ms — ${result.error}`,
    )
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
    console.info(
      `[cron/fetch-gold-price] skipped (duplicate) after ${durationMs}ms — ${result.reason}`,
    )
    return NextResponse.json({
      ok:        true,
      status:    'skipped',
      reason:    result.reason,
      timestamp: new Date().toISOString(),
      durationMs,
    })
  }

  // status === 'inserted'
  console.info(
    `[cron/fetch-gold-price] inserted ${result.snapshotId} ` +
    `barSell=${result.barSell} in ${durationMs}ms`,
  )
  return NextResponse.json({
    ok:         true,
    status:     'inserted',
    snapshotId: result.snapshotId,
    barSell:    result.barSell,
    timestamp:  new Date().toISOString(),
    durationMs,
  })
}
