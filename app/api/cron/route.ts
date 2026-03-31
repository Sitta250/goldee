import { NextRequest, NextResponse } from 'next/server'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'
import { isAuthorizedCronRequest } from '@/lib/security/cron-auth'

// ─── Legacy cron path — /api/cron ────────────────────────────────────────────
// Kept for backwards compatibility. The canonical cron path is now:
//   /api/cron/fetch-gold-price  (configured in vercel.json)
//
// Both paths call ingestGoldPrice() directly — no HTTP self-calls.

export async function GET(req: NextRequest) {
  const start  = Date.now()

  if (!isAuthorizedCronRequest(req)) {
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
