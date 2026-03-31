import { NextRequest, NextResponse } from 'next/server'

// ─── Cron handler ─────────────────────────────────────────────────────────────
// Called by Vercel Cron every 5 minutes (configured in vercel.json).
// Protected by CRON_SECRET so only Vercel's infrastructure can trigger it.
//
// Flow: validate secret → call /api/gold/fetch internally → return result

export async function GET(req: NextRequest) {
  // ── Security check ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const secret     = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the internal fetch handler
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/gold/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${secret}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[cron] gold fetch failed:', data)
      return NextResponse.json({ error: 'Fetch failed', detail: data }, { status: 500 })
    }

    return NextResponse.json({
      ok:        true,
      message:   'Gold price snapshot saved',
      snapshot:  data.snapshot,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal error', message: (err as Error).message },
      { status: 500 },
    )
  }
}
