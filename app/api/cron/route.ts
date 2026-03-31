import { NextRequest, NextResponse } from 'next/server'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'

// ─── Legacy cron path — /api/cron ────────────────────────────────────────────
// Kept for backwards compatibility. The canonical cron path is now:
//   /api/cron/fetch-gold-price  (configured in vercel.json)
//
// Both paths call ingestGoldPrice() directly — no HTTP self-calls.

export async function GET(req: NextRequest) {
  const start  = Date.now()
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization')

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result     = await ingestGoldPrice()
  const durationMs = Date.now() - start

  if (result.status === 'error') {
    return NextResponse.json(
      { ok: false, status: 'error', error: result.error, durationMs },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, durationMs, ...result })
}
