/**
 * exchange-rate.ts
 *
 * Fetches the USD → THB exchange rate from Frankfurter (api.frankfurter.app).
 * Free, no API key, backed by ECB. Supports THB.
 *
 * Cache strategy:
 *   The latest snapshot already stores usdThb. Before hitting the external API,
 *   we check the most recent snapshot. If it was fetched less than 1 hour ago
 *   AND has a usdThb value, we reuse it — zero extra API calls.
 *
 *   During in-session polling (~every 5 min in the Thai window), the external
 *   API is called at most about once per hour while snapshots arrive. The rate
 *   is stored with new snapshots and reused until stale.
 */

import { db } from '@/lib/db'

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD&to=THB'
const CACHE_TTL_MS    = 60 * 60 * 1_000  // 1 hour

interface FrankfurterResponse {
  rates: { THB?: number }
}

/**
 * Returns a fresh or cached USD → THB rate.
 *
 * 1. Query the most recent snapshot for a cached rate.
 * 2. If the cached rate is < 1 hour old, return it.
 * 3. Otherwise, fetch from Frankfurter and return the new rate.
 * 4. On fetch failure, fall back to the cached rate (even if stale).
 * 5. If no cached rate exists and fetch fails, return null.
 */
export async function getUsdThbRate(): Promise<number | null> {
  // ── 1. Check DB cache ──────────────────────────────────────────────────────
  const latest = await db.goldPriceSnapshot.findFirst({
    orderBy: { fetchedAt: 'desc' },
    select:  { fetchedAt: true, usdThb: true },
  })

  const cachedRate  = latest?.usdThb != null ? Number(latest.usdThb) : null
  const cachedAgeMs = latest ? Date.now() - latest.fetchedAt.getTime() : Infinity

  if (cachedRate !== null && cachedAgeMs < CACHE_TTL_MS) {
    return cachedRate
  }

  // ── 2. Fetch fresh rate ────────────────────────────────────────────────────
  try {
    const res = await fetch(FRANKFURTER_URL, {
      next:    { revalidate: 0 },  // bypass Next.js fetch cache — we manage TTL ourselves
      signal:  AbortSignal.timeout(5_000),
    })

    if (!res.ok) {
      throw new Error(`Frankfurter responded ${res.status}`)
    }

    const data = (await res.json()) as FrankfurterResponse
    const rate = data?.rates?.THB

    if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) {
      throw new Error(`Unexpected THB rate value: ${rate}`)
    }

    console.info(`[exchange-rate] fetched fresh USD/THB rate: ${rate}`)
    return rate

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[exchange-rate] fetch failed (${message}), using cached rate: ${cachedRate}`)
    return cachedRate  // stale-but-valid fallback; null if never fetched
  }
}
