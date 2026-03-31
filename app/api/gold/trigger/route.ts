import { NextResponse } from 'next/server'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'

// ─── Manual ingestion trigger — DEV ONLY ─────────────────────────────────────
// GET /api/gold/trigger
//
// Runs one full ingestion cycle immediately, without requiring a cron token.
// Blocked in production via NODE_ENV guard so it can never be called in prod.
//
// Usage during local development:
//   curl http://localhost:3000/api/gold/trigger
//   → or just open the URL in your browser

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production.' },
      { status: 403 },
    )
  }

  const result = await ingestGoldPrice()

  const status = result.status === 'error' ? 500 : 200
  return NextResponse.json({ ok: status === 200, ...result }, { status })
}
