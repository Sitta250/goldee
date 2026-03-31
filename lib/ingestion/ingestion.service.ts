import { withRetry }            from './retry'
import { validateAndNormalize, ValidationError } from './validate'
import { checkDuplicate, touchLastSeenAt }       from './dedupe'
import { insertSnapshot }        from './persist'
import { getActiveProvider }     from './providers'
import { getUsdThbRate }         from './exchange-rate'
import { upsertSourceStatus }    from '@/lib/queries/settings'
import type { IngestionResult }  from './types'

/**
 * ingestGoldPrice — main entry point for one ingestion cycle.
 *
 * Called by:
 *   /api/cron        (Vercel Cron, every 5 minutes, production)
 *   /api/gold/fetch  (internal, auth-gated, called by cron route)
 *   /api/gold/trigger (manual, dev only)
 *
 * Flow:
 *   1. Resolve the active provider (GOLD_PROVIDER env var, default: mock)
 *   2. Fetch the latest price — retries up to 3× on network errors
 *   3. Validate + normalise — throws ValidationError immediately on bad data
 *   4. Deduplicate against the most recent stored snapshot
 *      → duplicate: bump lastSeenAt on the existing row, return 'skipped'
 *      → new price:  insert a fresh snapshot row, return 'inserted'
 *   5. Update source_status after every cycle (success or failure)
 *   6. On error: log, update source_status as 'error', return 'error'
 *      (never throws — callers receive a typed result, not an exception)
 */
export async function ingestGoldPrice(): Promise<IngestionResult> {
  const provider = getActiveProvider()
  const label    = provider.sourceName

  try {
    // ── 1. Fetch gold price + exchange rate in parallel ─────────────────────
    const [raw, usdThb] = await Promise.all([
      withRetry(
        () => provider.fetchLatestPrice(),
        { label, maxAttempts: 3, baseDelayMs: 1_000 },
      ),
      getUsdThbRate(),
    ])

    // ── 2. Validate + normalise ──────────────────────────────────────────────
    // Attach the exchange rate (may be null if fetch failed and no cache exists)
    const price = validateAndNormalize({ ...raw, usdThb: raw.usdThb ?? usdThb })

    // ── 3. Deduplicate ───────────────────────────────────────────────────────
    const { isDuplicate, latestSnapshotId, reason } = await checkDuplicate(
      price,
      provider.sourceName,
    )

    if (isDuplicate && latestSnapshotId) {
      await touchLastSeenAt(latestSnapshotId)

      console.info(
        `[ingestion/${label}] skipped (duplicate) — lastSeenAt updated. ` +
        `barSell=${price.barSell} ann=${price.announcementNumber ?? '—'}`,
      )

      await upsertSourceStatus(provider.sourceName, provider.displayName, 'ok', {
        lastSuccessPrice: price.barSell,
      })

      return {
        status:     'skipped',
        reason:     reason ?? 'identical to most recent snapshot',
        isDuplicate: true,
      }
    }

    // ── 4. Persist ───────────────────────────────────────────────────────────
    const snapshot = await insertSnapshot(price, provider.sourceName)

    console.info(
      `[ingestion/${label}] inserted ${snapshot.id} — ` +
      `barSell=${snapshot.goldBarSell} ann=${snapshot.announcementNumber ?? '—'}`,
    )

    // ── 5. Update source health ──────────────────────────────────────────────
    await upsertSourceStatus(provider.sourceName, provider.displayName, 'ok', {
      lastSuccessPrice: snapshot.goldBarSell,
    })

    return {
      status:     'inserted',
      snapshotId: snapshot.id,
      barSell:    snapshot.goldBarSell,
      isDuplicate: false,
    }

  } catch (err) {
    const message      = err instanceof Error ? err.message : String(err)
    const isValidation = err instanceof ValidationError

    console.error(
      `[ingestion/${label}] ${isValidation ? 'validation' : 'fetch'} error: ${message}`,
    )

    // Record failure — best-effort, don't let status tracking shadow the real error
    try {
      await upsertSourceStatus(
        provider.sourceName,
        provider.displayName,
        'error',
        { errorMessage: message },
      )
    } catch (statusErr) {
      console.error('[ingestion] failed to update source_status:', statusErr)
    }

    return { status: 'error', error: message, isDuplicate: false }
  }
}
