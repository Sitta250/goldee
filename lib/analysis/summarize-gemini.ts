/**
 * Gemini 2.5 Flash summarizer.
 *
 * Constraints enforced here:
 * - Model: `GEMINI_MODEL` or default gemini-2.5-flash; optional `GEMINI_FALLBACK_MODEL` after transient failures
 * - Secret: GEMINI_API_KEY only
 * - No tool use / browsing / research — text generation only
 * - Returns strict JSON matching GoldAnalysisPayload
 * - Bilingual output: every text field has { th, en } variants
 * - Morning (09:30 UTC+7) vs evening (18:00 UTC+7) prompt variants
 */

import type {
  AnalysisInputBundle,
  GoldAnalysisPayload,
  PriceFacts,
  RunWindow,
} from '@/types/analysis'
import { withRetry } from '@/lib/ingestion/retry'

/** Default when `GEMINI_MODEL` is unset. */
const DEFAULT_MODEL = 'gemini-2.5-flash'
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models'
/** Per-attempt request timeout (each retry gets a fresh controller). */
const TIMEOUT_MS    = 90_000

const GEMINI_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
/** More attempts + longer gaps help during sustained 503 "high demand" windows. */
const GEMINI_MAX_ATTEMPTS     = 6
const GEMINI_RETRY_BASE_MS    = 4_000

class GeminiTransientError extends Error {
  constructor(
    readonly status: number,
    bodySnippet: string,
  ) {
    super(`Gemini API error ${status}: ${bodySnippet}`)
    this.name = 'GeminiTransientError'
  }
}

/** Bilingual JSON payload can be large; 2048 was truncating mid-JSON. */
const MAX_OUTPUT_TOKENS = 8192

const SHARED_RULES = `1. Summarise ONLY the facts and evidence provided in the user message.
2. NEVER invent prices, dates, sources, experts, events, or statistics.
3. NEVER give investment advice. Do NOT use words: buy, sell, recommend, should invest, profitable.
4. Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON.
5. ALL text fields must contain BOTH Thai (th) and English (en) values.
6. Echo the numeric values from the provided priceFacts exactly — do not alter them.
7. NEVER output generic filler: "ไม่มีข่าวล่าสุด", "no news available", "ไม่มีข้อมูล". When external evidence is absent, use domestic price movement, Thai baht direction, or intraday range from priceFacts instead — these are always actionable.`

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildSystemInstruction(runWindow: RunWindow): string {
  if (runWindow === 'morning') {
    return `You are a financial market summarization engine.

This is the MORNING (09:30 Thailand time, UTC+7) gold market briefing.

Your job is to explain:
- what happened overnight / into this morning
- what is currently influencing gold
- what to watch during today's session

${SHARED_RULES}

7. Do NOT describe the full trading day outcome (the day is not complete).
8. Be cautious about causation. If uncertain, treat as potential influence and use impact_type "could_affect" with appropriate confidence.
9. Distinguish observed moves (already_affecting) from possible drivers (could_affect).
10. Use conservative language when evidence is mixed or weak.`
  }

  return `You are a financial market summarization engine.

This is the EVENING (18:00 Thailand time, UTC+7) gold market wrap.

Your job is to explain:
- what happened over the session / day (using provided facts and evidence)
- what appears to have influenced the move
- how strong the evidence is for each influence

${SHARED_RULES}

7. Do NOT speculate about tomorrow or the next session.
8. Be strict about causation: use "already_affecting" only when multiple reputable items clearly align; otherwise prefer "could_affect" with lower confidence.
9. Distinguish strong evidence (already_affecting + higher confidence) from plausible but unproven influence (could_affect + medium/low confidence).
10. If evidence is weak or conflicting, say so explicitly — do not guess.`
}

function buildEvidenceSections(bundle: AnalysisInputBundle): string {
  const { priceFacts: pf, newsItems, expertItems } = bundle

  const newsBlock = newsItems.length > 0
    ? newsItems.map((n, i) =>
        `[N${i + 1}] "${n.title}" — ${n.source} (${n.publishedAt.toISOString().slice(0, 10)})\n${n.summary}`,
      ).join('\n\n')
    : `No external news provided for this window.
Use domestic price movement and the price facts above as primary context for market_drivers and watch_list.
Focus on: intraday range (${pf.intraday_range_abs.toFixed(2)} THB), Thai baht direction vs USD, and the ${pf.trend_direction} trend.`

  const expertBlock = expertItems.length > 0
    ? expertItems.map((e, i) =>
        `[E${i + 1}] ${e.expert} (${e.source}, ${e.publishedAt.toISOString().slice(0, 10)}): "${e.quote}"`,
      ).join('\n\n')
    : `No expert commentary provided.
Base expert_view on price_signals: trend_direction="${pf.trend_direction}", bias_today="${pf.bias_today}", bias_week="${pf.bias_week}". Set consensus_strength to "low".`

  return `=== PRICE FACTS (computed by backend, do not alter) ===
Current Thai gold bar sell price: ${pf.currentPrice.toFixed(2)} THB/baht-weight
vs Yesterday: ${pf.change_vs_yesterday_abs >= 0 ? '+' : ''}${pf.change_vs_yesterday_abs.toFixed(2)} THB (${pf.change_vs_yesterday_pct >= 0 ? '+' : ''}${pf.change_vs_yesterday_pct.toFixed(2)}%)
vs 7 days ago: ${pf.change_vs_7d_abs >= 0 ? '+' : ''}${pf.change_vs_7d_abs.toFixed(2)} THB (${pf.change_vs_7d_pct >= 0 ? '+' : ''}${pf.change_vs_7d_pct.toFixed(2)}%)
Intraday range: ${pf.intraday_range_abs.toFixed(2)} THB
Direction today: ${pf.direction_today}
Direction this week: ${pf.direction_week}
MA50 (50-day moving average): ${pf.ma_50 != null ? pf.ma_50.toFixed(2) + ' THB' : 'insufficient data'}
MA200 (200-day moving average): ${pf.ma_200 != null ? pf.ma_200.toFixed(2) + ' THB' : 'insufficient data'}
Trend direction: ${pf.trend_direction}
Bias today: ${pf.bias_today}
Bias this week: ${pf.bias_week}

=== NEWS ITEMS (last ~24–48h window as ranked, max 12) ===
${newsBlock}

=== EXPERT COMMENTARY (allowlist sources only, max 5 items) ===
${expertBlock}`
}

function buildJsonSchemaExample(pf: PriceFacts): string {
  return `{
  "price_analysis": {
    "headline": { "th": "สถานะวันนี้: [ขึ้น/ลง/ทรงตัว] — one-line factual headline", "en": "..." },
    "summary":  { "th": "...", "en": "..." },
    "vs_yesterday": {
      "direction": "${pf.direction_today}",
      "absolute_change": ${pf.change_vs_yesterday_abs},
      "percent_change":  ${pf.change_vs_yesterday_pct}
    },
    "vs_7d": {
      "direction": "${pf.direction_week}",
      "absolute_change": ${pf.change_vs_7d_abs},
      "percent_change":  ${pf.change_vs_7d_pct}
    }
  },
  "price_signals": {
    "trend_direction": "${pf.trend_direction}",
    "bias_today":      "${pf.bias_today}",
    "bias_week":       "${pf.bias_week}"
  },
  "market_drivers": [
    {
      "theme":       { "th": "...", "en": "..." },
      "impact_type": "already_affecting|could_affect",
      "summary":     { "th": "one grounded bullet — cite the specific factor from inputs", "en": "..." },
      "confidence":  "low|medium|high",
      "source_count": 0
    }
  ],
  "watch_list": [
    { "th": "สิ่งที่ต้องจับตา bullet 1 — specific, forward-looking, grounded in inputs", "en": "..." },
    { "th": "สิ่งที่ต้องจับตา bullet 2", "en": "..." }
  ],
  "today_view": {
    "suitable_for": "buyers|sellers|waiting|mixed",
    "summary": { "th": "เหมาะสำหรับ... — ≤40 words, neutral framing, no investment advice", "en": "..." }
  },
  "expert_view": {
    "overall_trend":      "bullish|bearish|mixed|unclear",
    "summary":            { "th": "...", "en": "..." },
    "consensus_strength": "low|medium|high"
  },
  "disclaimer": {
    "th": "บทวิเคราะห์นี้สร้างขึ้นโดย AI จากข้อมูลตลาดและข่าวสารที่รวบรวม ไม่ใช่คำแนะนำการลงทุน",
    "en": "AI-generated summary based on aggregated market data and news sources. Not investment advice."
  }
}`
}

function buildMorningRequirements(): string {
  return `=== MORNING BRIEFING REQUIREMENTS ===

Generate a concise MORNING gold market briefing structured in EXACTLY four named sections.

SECTION 1 — PRICE ANALYSIS (price_analysis)
- headline.th: start with "สถานะวันนี้: ขึ้น / ลง / ทรงตัว" then one factual phrase.
- summary: overnight / early-session movement from provided facts. ≤80 words per language. No full-day speculation.

SECTION 2 — เหตุผลหลัก (market_drivers, 2–4 items)
- Each driver is one grounded bullet tied to a specific input item (N1…Nn) or price fact.
- impact_type mapping: strong evidence → "already_affecting"; plausible → "could_affect".
- No vague drivers. If inputs are thin, use domestic factors from priceFacts (range, trend, baht).
- summary ≤50 words per language.

SECTION 3 — สิ่งที่ต้องจับตา (watch_list, 1–3 items)
- Forward-looking factors for today's session grounded in provided evidence.
- If no forward-looking items in inputs: use macro schedule, baht movement, or price support/resistance levels from priceFacts.
- NEVER output "ไม่มีข่าวล่าสุด" or empty bullets. Always give at least 1 specific, actionable item.

SECTION 4 — มุมมองวันนี้ (today_view)
- suitable_for: infer from direction + price_signals ONLY:
  - up + bullish bias → "sellers" (price elevated, profit-taking context) OR "waiting" (momentum may extend)
  - down + bearish bias → "buyers" (price lower, dip context) OR "waiting" (further decline possible)
  - flat / mixed signals → "waiting" or "mixed"
- summary.th: ≤40 words. Use "เหมาะสำหรับ" framing, neutral, NO investment advice.

EXPERT VIEW (expert_view)
- Summarize current sentiment from provided expert items only. If none: base on price_signals, set consensus_strength "low".

TONE: neutral, concise, no hype.
source_count = integer count of N-items supporting that driver theme; do not invent.`
}

function buildEveningRequirements(): string {
  return `=== EVENING WRAP REQUIREMENTS ===

Generate a concise EVENING gold market wrap structured in EXACTLY four named sections.

SECTION 1 — PRICE ANALYSIS (price_analysis)
- headline.th: start with "สถานะวันนี้: ขึ้น / ลง / ทรงตัว" then one factual phrase about the day's move.
- summary: day's move using provided price facts. ≤80 words per language. No tomorrow speculation.

SECTION 2 — เหตุผลหลัก (market_drivers, 2–4 items)
- Each driver is one grounded bullet tied to input evidence or price facts.
- Evidence strength: multiple aligned reputable items → "already_affecting" high/medium; plausible → "could_affect" medium; weak/conflicting → "could_affect" low.
- If inputs are thin, use intraday range, trend, and baht rate from priceFacts.
- summary ≤50 words per language.

SECTION 3 — สิ่งที่ต้องจับตา (watch_list, 1–3 items)
- Near-term catalysts or risks from provided evidence that could affect gold in coming days.
- If no forward-looking items in inputs: reference scheduled macro events implied by news dates, or baht/USD trends.
- NEVER output "ไม่มีข่าวล่าสุด" or empty bullets. Always give at least 1 specific item.

SECTION 4 — มุมมองวันนี้ (today_view)
- suitable_for: infer from direction + price_signals ONLY:
  - up + bullish bias → "sellers" (elevated price, profit-taking context) OR "waiting"
  - down + bearish bias → "buyers" (lower price, dip context) OR "waiting"
  - flat / mixed → "waiting" or "mixed"
- summary.th: ≤40 words. "เหมาะสำหรับ" framing, neutral, NO investment advice.

EXPERT VIEW (expert_view)
- End-of-day sentiment from provided items. If none: base on price_signals, set consensus_strength "low".

TONE: factual, no hype. Do NOT speculate about tomorrow.
source_count = integer count of N-items supporting that driver theme; do not invent.`
}

function buildUserPrompt(bundle: AnalysisInputBundle, runWindow: RunWindow): string {
  const pf = bundle.priceFacts
  const taskLine =
    runWindow === 'morning'
      ? 'Generate a morning gold market briefing.'
      : 'Generate an evening gold market wrap.'

  const requirements =
    runWindow === 'morning'
      ? buildMorningRequirements()
      : buildEveningRequirements()

  return `${taskLine}

${buildEvidenceSections(bundle)}

${requirements}

=== REQUIRED OUTPUT FORMAT (strict JSON, no markdown) ===
Return EXACTLY this structure. Every string field must have "th" (Thai) and "en" (English).

${buildJsonSchemaExample(pf)}`
}

// ─── Gemini API call ──────────────────────────────────────────────────────────

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
}

function resolvePrimaryModel(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim()
  return fromEnv || DEFAULT_MODEL
}

async function callGeminiApi(
  prompt:            string,
  systemInstruction: string,
  modelId:           string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set')

  const url  = `${GEMINI_URL}/${modelId}:generateContent?key=${apiKey}`
  // REST schema uses camelCase (see ai.google.dev generateContent reference).
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents:          [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig:  {
      temperature:       0.2,
      topP:              0.8,
      maxOutputTokens:   MAX_OUTPUT_TOKENS,
      responseMimeType:  'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }

  const bodyJson = JSON.stringify(body)

  return withRetry(
    async () => {
      const controller = new AbortController()
      const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    bodyJson,
          signal:  controller.signal,
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          const clip = text.slice(0, 200)
          if (GEMINI_RETRYABLE_STATUS.has(res.status)) {
            throw new GeminiTransientError(res.status, clip)
          }
          throw new Error(`Gemini API error ${res.status}: ${clip}`)
        }

        const data: GeminiResponse = await res.json()
        const candidate = data.candidates?.[0]
        const text      = candidate?.content?.parts?.[0]?.text ?? ''
        if (!text) throw new Error('Gemini returned empty response')

        if (candidate?.finishReason === 'MAX_TOKENS') {
          throw new Error(
            'Gemini hit MAX_TOKENS (response truncated). Increase MAX_OUTPUT_TOKENS or shorten prompts.',
          )
        }

        return text
      } finally {
        clearTimeout(timer)
      }
    },
    {
      maxAttempts:    GEMINI_MAX_ATTEMPTS,
      baseDelayMs:    GEMINI_RETRY_BASE_MS,
      label:          modelId,
      logNamespace:   'gemini',
      shouldRetry:    (err) =>
        err instanceof GeminiTransientError || err.name === 'AbortError',
    },
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SummarizeResult {
  raw:          string
  parsed:       GoldAnalysisPayload
  modelName:    string
  modelVersion: string | null
}

/**
 * Calls Gemini and returns the parsed payload.
 * Throws on API error — the caller (validate-output) handles retries.
 */
export async function summarizeWithGemini(
  bundle:         AnalysisInputBundle,
  stricterPrompt: boolean,
  runWindow:      RunWindow,
): Promise<SummarizeResult> {
  const systemInstruction = buildSystemInstruction(runWindow)
  let userPrompt            = buildUserPrompt(bundle, runWindow)

  if (stricterPrompt) {
    userPrompt += '\n\nIMPORTANT: Return ONLY the JSON object. No additional text.'
  }

  const primary = resolvePrimaryModel()

  const run = async (modelId: string): Promise<SummarizeResult> => {
    const raw    = await callGeminiApi(userPrompt, systemInstruction, modelId)
    const parsed = parseJsonResponse(raw)
    return { raw, parsed, modelName: modelId, modelVersion: null }
  }

  try {
    return await run(primary)
  } catch (err) {
    const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim()
    if (
      fallback &&
      fallback !== primary &&
      err instanceof GeminiTransientError
    ) {
      console.warn(
        `[gemini] model ${primary} failed after retries (${err.status}); ` +
        `trying fallback ${fallback}`,
      )
      return await run(fallback)
    }
    throw err
  }
}

/** Strip optional markdown code fences and parse JSON */
function parseJsonResponse(raw: string): GoldAnalysisPayload {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    return JSON.parse(cleaned) as GoldAnalysisPayload
  } catch {
    throw new Error(`Gemini response is not valid JSON: ${cleaned.slice(0, 200)}`)
  }
}
