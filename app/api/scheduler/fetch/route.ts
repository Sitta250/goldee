import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { ingestGoldPrice } from '@/lib/ingestion/ingestion.service'
import { isAuthorizedCronRequest } from '@/lib/security/cron-auth'

// Legacy scheduler endpoint.
// Kept for backward compatibility while GitHub Actions fetches upstream data and
// posts normalized payloads to /api/scheduler/ingest.
// Expected auth header: Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const start = Date.now()

  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await ingestGoldPrice()
  const durationMs = Date.now() - start

  if (result.status === 'error') {
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        error: result.error,
        timestamp: new Date().toISOString(),
        durationMs,
      },
      { status: 500 },
    )
  }

  if (result.status === 'skipped') {
    return NextResponse.json({
      ok: true,
      status: 'skipped',
      reason: result.reason,
      timestamp: new Date().toISOString(),
      durationMs,
    })
  }

  revalidatePath('/')
  revalidatePath('/history')

  return NextResponse.json({
    ok: true,
    status: 'inserted',
    snapshotId: result.snapshotId,
    barSell: result.barSell,
    timestamp: new Date().toISOString(),
    durationMs,
  })
}
