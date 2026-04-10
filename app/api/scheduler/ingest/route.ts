import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { ingestNormalizedPayload, type NormalizedIngestPayload } from '@/lib/ingestion/ingest-normalized'
import { isAuthorizedCronRequest } from '@/lib/security/cron-auth'
import {
  isThaiGoldPollingWindow,
  shouldBypassThaiFetchWindow,
} from '@/lib/utils/thai-market-hours'

function parsePayload(body: unknown): NormalizedIngestPayload {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Invalid JSON payload')
  }

  const p = body as Record<string, unknown>
  const source = String(p.source ?? '').trim()
  const asTime = String(p.asTime ?? '').trim()
  const seq = String(p.seq ?? '').trim()
  const fetchedAt = String(p.fetchedAt ?? '').trim()

  const barBuy = Number(p.barBuy)
  const barSell = Number(p.barSell)
  const ornamentBuy = Number(p.ornamentBuy)
  const ornamentSell = Number(p.ornamentSell)

  if (!source) throw new Error('source is required')
  if (!asTime || Number.isNaN(new Date(asTime).getTime())) throw new Error('asTime must be a valid ISO timestamp')
  if (!seq) throw new Error('seq is required')
  if (!fetchedAt || Number.isNaN(new Date(fetchedAt).getTime())) throw new Error('fetchedAt must be a valid ISO timestamp')

  const prices: Array<[string, number]> = [
    ['barBuy', barBuy],
    ['barSell', barSell],
    ['ornamentBuy', ornamentBuy],
    ['ornamentSell', ornamentSell],
  ]

  for (const [name, value] of prices) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a positive number`)
    }
  }

  return { source, asTime, seq, barBuy, barSell, ornamentBuy, ornamentSell, fetchedAt }
}

export async function POST(req: NextRequest) {
  const start = Date.now()

  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!shouldBypassThaiFetchWindow() && !isThaiGoldPollingWindow()) {
      const durationMs = Date.now() - start
      console.info('[scheduler/ingest] skipped — outside Thai polling window')
      return NextResponse.json({
        ok:        true,
        status:    'skipped',
        reason:    'outside_thai_polling_window',
        timestamp: new Date().toISOString(),
        durationMs,
      })
    }

    const raw = await req.json()
    const payload = parsePayload(raw)
    const result = await ingestNormalizedPayload(payload)
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        error: message,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - start,
      },
      { status: 400 },
    )
  }
}
