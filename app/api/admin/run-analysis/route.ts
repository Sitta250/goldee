import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAuthorizedCronRequest } from '@/lib/security/cron-auth'
import { runGoldAnalysis } from '@/lib/analysis/analysis.service'

// ─── Manual analysis run — /api/admin/run-analysis ───────────────────────────
//
// Same auth as /api/admin/run-fetch: Authorization: Bearer <CRON_SECRET>
//
// Triggers the full pipeline (prices → news → Gemini summary → DB). Use this to
// verify GEMINI_API_KEY and the summarizer without waiting for cron.
//
//   curl -H "Authorization: Bearer <CRON_SECRET>" \
//        http://localhost:3000/api/admin/run-analysis
//
// If you see status "skipped", inputs match a previous run for this window. To
// force another Gemini call (e.g. local testing), add ?force=1 :
//
//   curl -H "Authorization: Bearer <CRON_SECRET>" \
//        "http://localhost:3000/api/admin/run-analysis?force=1"
//
// Set GEMINI_API_KEY in .env.local for real summaries. If it is missing or the API
// fails, the service still inserts a row with isValid: false and validationError
// explaining the error (check the JSON body and the DB row).

export async function GET(req: NextRequest) {
  const startedAt = Date.now()

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not set in environment variables.' },
      { status: 500 },
    )
  }

  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  console.info('[admin/run-analysis] Manual gold analysis triggered')

  try {
    const force = req.nextUrl.searchParams.get('force') === '1'
    const result = await runGoldAnalysis({ bypassIdempotency: force })
    const durationMs = Date.now() - startedAt

    if (result.status === 'inserted' || result.status === 'fallback') {
      revalidatePath('/')
    }

    const ok = result.status !== 'error'

    return NextResponse.json(
      {
        ok,
        ...result,
        timestamp:  new Date().toISOString(),
        durationMs,
      },
      { status: ok ? 200 : 500 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[admin/run-analysis]', message)
    return NextResponse.json(
      {
        ok:         false,
        status:     'error' as const,
        error:      message,
        timestamp:  new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 },
    )
  }
}
