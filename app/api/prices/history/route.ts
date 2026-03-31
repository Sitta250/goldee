import { NextRequest, NextResponse } from 'next/server'
import type { Timeframe } from '@/types/gold'
import { getSnapshotsByRange } from '@/lib/queries/prices'

// ─── Chart history endpoint ───────────────────────────────────────────────────
// Called client-side by TrendChart when the user switches timeframes.
// Returns lightweight { timestamp, barSell }[] points, downsampled to ≤200.
//
// Cache-Control: 4 minutes (slightly under 5-min cron) so most requests
// are served from Vercel's edge cache with a fresh copy arriving after each cron.

const VALID_TIMEFRAMES: Timeframe[] = ['1D', '7D', '30D', '6M', '1Y']

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const range = searchParams.get('range') as Timeframe | null

  if (!range || !VALID_TIMEFRAMES.includes(range)) {
    return NextResponse.json(
      { error: `Invalid range. Must be one of: ${VALID_TIMEFRAMES.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    const points = await getSnapshotsByRange(range)

    return NextResponse.json(
      { range, points },
      {
        headers: {
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
