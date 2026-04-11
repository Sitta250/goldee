/**
 * GET /api/scheduler/analysis
 *
 * Cron-triggered endpoint for the Today Gold Analysis.
 * Runs once per day around 10:45 Asia/Bangkok (03:45 UTC).
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath }            from 'next/cache'
import { isAuthorizedCronRequest }   from '@/lib/security/cron-auth'
import { runGoldAnalysis }           from '@/lib/analysis/analysis.service'

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const result = await runGoldAnalysis()

    console.log('[analysis-cron]', {
      status:    result.status,
      id:        result.id,
      inputHash: result.inputHash,
      durationMs: Date.now() - startedAt,
    })

    if (result.status === 'inserted' || result.status === 'fallback') {
      revalidatePath('/')
    }

    const ok = result.status !== 'error'
    return NextResponse.json(
      {
        ok,
        ...result,
        timestamp:  new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: ok ? 200 : 500 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analysis-cron] fatal error:', message)

    return NextResponse.json(
      { status: 'error', error: message, durationMs: Date.now() - startedAt },
      { status: 500 },
    )
  }
}
