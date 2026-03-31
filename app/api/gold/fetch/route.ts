import { NextRequest, NextResponse } from 'next/server'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'

// ─── Internal gold price fetch + store ───────────────────────────────────────
// Called only by /api/cron. Not meant to be called directly from the browser.
// Protected by the same CRON_SECRET.
//
// Delegates entirely to ingestGoldPrice() — no fetch/validate/persist logic here.
// Returns a typed JSON response based on the ingestion result.

export async function POST(req: NextRequest) {
  // ── Security check ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const secret     = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await ingestGoldPrice()

  if (result.status === 'error') {
    return NextResponse.json(
      { ok: false, status: result.status, error: result.error },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, ...result })
}
