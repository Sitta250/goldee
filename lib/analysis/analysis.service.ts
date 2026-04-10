/**
 * Main orchestrator for the Today Gold Analysis feature.
 *
 * Call `runGoldAnalysis()` from the scheduler cron route.
 * Idempotent per run window — skips if an identical input hash already exists.
 */

import { db }                   from '@/lib/db'
import { computePriceFacts }    from './compute-price-facts'
import { fetchGlobalNews }      from './fetch-global-news'
import { rankAndDedupNews }     from './rank-news'
import { fetchExpertCommentary } from './fetch-expert-commentary'
import { rankExperts }          from './rank-experts'
import { buildInputBundle, hashInputBundle, buildNewsWindow } from './build-input-bundle'
import { summarizeWithGemini }  from './summarize-gemini'
import { validateOutput, buildFallbackPayload } from './validate-output'
import { getRunWindow }         from '@/types/analysis'
import type { GoldAnalysisPayload } from '@/types/analysis'

// ─── Run result ───────────────────────────────────────────────────────────────

export type AnalysisRunStatus =
  | 'inserted'       // new analysis persisted
  | 'skipped'        // identical input hash already in DB for this window
  | 'fallback'       // persisted but with safe fallback (validation failed twice)
  | 'error'          // fatal error — nothing persisted

export interface AnalysisRunResult {
  status:     AnalysisRunStatus
  id?:        string
  inputHash?: string
  error?:     string
  /** Present when status === 'skipped' — why no Gemini run happened */
  skipReason?: string
  /** Present after a row is written — whether Gemini output passed validation */
  isValid?: boolean
  /** Present when status === 'fallback' — API/parse failure or validation errors (semicolon-separated) */
  validationError?: string
}

export interface RunGoldAnalysisOptions {
  /** If true, skip the idempotency check and call Gemini even when inputHash matches an existing row. */
  bypassIdempotency?: boolean
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runGoldAnalysis(
  options: RunGoldAnalysisOptions = {},
): Promise<AnalysisRunResult> {
  // 1. Compute deterministic price facts
  const priceFacts = await computePriceFacts()
  if (!priceFacts) {
    return { status: 'error', error: 'No price snapshots available — DB is empty' }
  }

  // 2. Fetch + rank news and expert commentary
  const [rawNews, rawExperts] = await Promise.allSettled([
    fetchGlobalNews(),
    fetchExpertCommentary(),
  ])

  const newsItems    = rankAndDedupNews(
    rawNews.status === 'fulfilled' ? rawNews.value : [],
  ).slice(0, 12)

  const expertItems  = rankExperts(
    rawExperts.status === 'fulfilled' ? rawExperts.value : [],
  ).slice(0, 5)

  // 3. Build + hash the input bundle
  const bundle       = buildInputBundle(priceFacts, newsItems, expertItems)
  const inputHash    = hashInputBundle(bundle)
  const newsWindow   = buildNewsWindow(newsItems)

  // 4. Determine current run window (morning / evening UTC+7)
  const nowUtcPlus7Hour = (new Date().getUTCHours() + 7) % 24
  const runWindow       = getRunWindow(nowUtcPlus7Hour)

  // 5. Idempotency check — skip if same hash already stored for this window
  if (!options.bypassIdempotency) {
    const existing = await db.goldAnalysis.findFirst({
      where:   { runWindow, inputHash },
      orderBy: { generatedAt: 'desc' },
      select:  { id: true },
    })
    if (existing) {
      return {
        status:     'skipped',
        id:         existing.id,
        inputHash,
        skipReason:
          'Same price/news input was already analyzed for this run window (morning/evening). Cron uses this to avoid duplicate work.',
      }
    }
  }

  // 6. Call Gemini — retry once with stricter prompt on validation failure
  let payload:         GoldAnalysisPayload
  let isValid          = true
  let validationError: string | null = null
  let modelVersion:    string | null = null
  let modelNameForDb   = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'

  try {
    const result1 = await summarizeWithGemini(bundle, false, runWindow)
    modelVersion   = result1.modelVersion
    modelNameForDb = result1.modelName

    const check1 = validateOutput(result1.parsed, priceFacts, bundle)
    if (check1.ok) {
      payload = result1.parsed
    } else {
      console.warn(
        `[goldee/analysis] Validation attempt 1 failed (${check1.errors.length} error(s)): ` +
        check1.errors.slice(0, 5).join('; '),
      )
      // Retry with stricter prompt
      const result2 = await summarizeWithGemini(bundle, true, runWindow)
      modelNameForDb = result2.modelName
      const check2  = validateOutput(result2.parsed, priceFacts, bundle)

      if (check2.ok) {
        payload = result2.parsed
      } else {
        console.error(
          `[goldee/analysis] Both validation attempts failed — using fallback payload. ` +
          `Final errors (${check2.errors.length}): ${check2.errors.join('; ')}`,
        )
        // Both attempts failed — use safe fallback
        payload        = buildFallbackPayload(priceFacts)
        isValid        = false
        validationError = check2.errors.join('; ')
      }
    }
  } catch (err) {
    // Gemini API error — persist safe fallback so homepage always has data
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[goldee/analysis] Gemini API error — using fallback payload: ${errMsg}`)
    payload        = buildFallbackPayload(priceFacts)
    isValid        = false
    validationError = errMsg
  }

  // 7. Persist
  const record = await db.goldAnalysis.create({
    data: {
      basedOnPriceTimestamp: priceFacts.priceTimestamp,
      basedOnNewsWindow:     newsWindow,
      modelName:             modelNameForDb,
      modelVersion,
      inputHash,
      runWindow,
      payload:               payload as object,
      isValid,
      validationError,
    },
  })

  return {
    status:    isValid ? 'inserted' : 'fallback',
    id:        record.id,
    inputHash,
    isValid,
    ...(isValid ? {} : { validationError: validationError ?? undefined }),
  }
}
