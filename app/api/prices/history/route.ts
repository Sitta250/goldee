import { NextRequest, NextResponse } from 'next/server'
import type { Timeframe } from '@/types/gold'

// TODO: Uncomment when DB is ready
// import { getSnapshotsByRange } from '@/lib/queries/prices'

const VALID_TIMEFRAMES: Timeframe[] = ['1D', '7D', '30D', '6M', '1Y']

// ─── Chart history endpoint ───────────────────────────────────────────────────
// Called client-side by TrendChart when the user switches timeframes.
// Returns a lightweight array of { timestamp, barSell } points.

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const range = searchParams.get('range') as Timeframe | null

  // Validate timeframe param
  if (!range || !VALID_TIMEFRAMES.includes(range)) {
    return NextResponse.json(
      { error: `Invalid range. Must be one of: ${VALID_TIMEFRAMES.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    // TODO: Replace mock data with real query
    // const points = await getSnapshotsByRange(range)

    // ── Mock response (remove when DB is ready) ──────────────────────────────
    const hoursMap: Record<Timeframe, number> = {
      '1D':   24,
      '7D':   7 * 24,
      '30D':  30 * 24,
      '6M':   180 * 24,
      '1Y':   365 * 24,
    }
    const hours = hoursMap[range]
    const points = Array.from({ length: Math.min(hours, 200) }, (_, i) => {
      const fraction = i / Math.min(hours, 200)
      return {
        timestamp: new Date(Date.now() - (1 - fraction) * hours * 60 * 60 * 1000).toISOString(),
        barSell:   47000 + Math.round(Math.sin(fraction * Math.PI * 4) * 400 + Math.random() * 100),
      }
    })
    // ── End mock ─────────────────────────────────────────────────────────────

    return NextResponse.json(
      { range, points },
      {
        headers: {
          // Cache for 4 minutes — slightly under the 5-min cron interval
          'Cache-Control': 'public, s-maxage=240, stale-while-revalidate=60',
        },
      },
    )
  } catch (err) {
    console.error('[prices/history] error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 },
    )
  }
}
