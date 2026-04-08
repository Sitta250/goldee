/**
 * Gemini 2.5 Flash summarizer.
 *
 * Constraints enforced here:
 * - Model: gemini-2.5-flash
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

const MODEL       = 'gemini-2.5-flash'
const GEMINI_URL  = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIMEOUT_MS  = 90_000

/** Bilingual JSON payload can be large; 2048 was truncating mid-JSON. */
const MAX_OUTPUT_TOKENS = 8192

const SHARED_RULES = `1. Summarise ONLY the facts and evidence provided in the user message.
2. NEVER invent prices, dates, sources, experts, events, or statistics.
3. NEVER give investment advice. Do NOT use words: buy, sell, recommend, should invest, profitable.
4. Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON.
5. ALL text fields must contain BOTH Thai (th) and English (en) values.
6. Echo the numeric values from the provided priceFacts exactly — do not alter them.`

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
    : 'No recent gold news available.'

  const expertBlock = expertItems.length > 0
    ? expertItems.map((e, i) =>
        `[E${i + 1}] ${e.expert} (${e.source}, ${e.publishedAt.toISOString().slice(0, 10)}): "${e.quote}"`,
      ).join('\n\n')
    : 'No expert commentary available.'

  return `=== PRICE FACTS (computed by backend, do not alter) ===
Current Thai gold bar sell price: ${pf.currentPrice.toFixed(2)} THB/baht-weight
vs Yesterday: ${pf.change_vs_yesterday_abs >= 0 ? '+' : ''}${pf.change_vs_yesterday_abs.toFixed(2)} THB (${pf.change_vs_yesterday_pct >= 0 ? '+' : ''}${pf.change_vs_yesterday_pct.toFixed(2)}%)
vs 7 days ago: ${pf.change_vs_7d_abs >= 0 ? '+' : ''}${pf.change_vs_7d_abs.toFixed(2)} THB (${pf.change_vs_7d_pct >= 0 ? '+' : ''}${pf.change_vs_7d_pct.toFixed(2)}%)
Intraday range: ${pf.intraday_range_abs.toFixed(2)} THB
Direction today: ${pf.direction_today}
Direction this week: ${pf.direction_week}

=== NEWS ITEMS (last ~24–48h window as ranked, max 12) ===
${newsBlock}

=== EXPERT COMMENTARY (allowlist sources only, max 5 items) ===
${expertBlock}`
}

function buildJsonSchemaExample(pf: PriceFacts): string {
  return `{
  "price_analysis": {
    "headline": { "th": "...", "en": "..." },
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
  "market_drivers": [
    {
      "theme":       { "th": "...", "en": "..." },
      "impact_type": "already_affecting|could_affect",
      "summary":     { "th": "...", "en": "..." },
      "confidence":  "low|medium|high",
      "source_count": <integer>
    }
  ],
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

Generate a concise MORNING gold market briefing (Thai + global context).

PRICE ANALYSIS
- Focus on overnight / early-session movement vs prior close context using provided facts.
- Mention direction and magnitude clearly; do not speculate about full-day outcome.
- You may briefly note intraday range from facts if it helps context.

MARKET DRIVERS (2–4 themes)
- Identify key themes currently influencing gold.
- Map evidence to schema:
  - Strong current influence → impact_type "already_affecting" with confidence high/medium.
  - Possible influence today → impact_type "could_affect" with confidence medium.
  - Uncertain → impact_type "could_affect" with confidence "low" and explicit caution in text.

FORWARD LOOKING (no separate JSON field)
- Weave "what to watch today" (macro, Fed/yields/dollar, geopolitical risks) into market_drivers summaries and/or expert_view.summary — only if supported by input items.

EXPERT VIEW
- Summarize current sentiment / early positioning from provided expert items only.

TONE: neutral, concise, no hype.

Word limits per language: price_analysis.summary ≤80 words, each market_drivers[].summary ≤50 words, expert_view.summary ≤70 words.

source_count = integer count of provided news items (N1…Nn) that support that theme; do not invent.`
}

function buildEveningRequirements(): string {
  return `=== EVENING WRAP REQUIREMENTS ===

Generate a concise EVENING gold market wrap (Thai + global context).

PRICE ANALYSIS
- Describe the day's move using provided price facts (direction and magnitude).
- If intraday range in facts is meaningful, you may reference it briefly; do not invent OHLC beyond facts.

MARKET DRIVERS (2–4 themes)
Map evidence strength to schema:
- Multiple reputable items clearly align on a theme → impact_type "already_affecting", confidence "high" or "medium".
- Plausible but not proven → impact_type "could_affect", confidence "medium".
- Weak / conflicting / unclear → impact_type "could_affect", confidence "low" and state uncertainty in text.
Do not guess.

MORNING VS EVENING (optional)
- If news/expert text clearly contrasts earlier expectations vs today's outcome, mention briefly in price_analysis.summary or expert_view.summary. Do not invent a morning forecast you were not given.

EXPERT VIEW
- End-of-day sentiment: use overall_trend and consensus_strength to reflect whether sentiment strengthened, weakened, or stayed mixed vs the evidence.

TONE: factual, no hype. Do NOT speculate about tomorrow.

Word limits per language: price_analysis.summary ≤80 words, each market_drivers[].summary ≤50 words, expert_view.summary ≤70 words.

source_count = integer count of provided news items (N1…Nn) that support that theme; do not invent.`
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

async function callGeminiApi(prompt: string, systemInstruction: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set')

  const url  = `${GEMINI_URL}/${MODEL}:generateContent?key=${apiKey}`
  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generation_config: {
      temperature:      0.2,   // low randomness for factual tasks
      top_p:            0.8,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      response_mime_type: 'application/json',
    },
    safety_settings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }

  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 200)}`)
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

  const raw    = await callGeminiApi(userPrompt, systemInstruction)
  const parsed = parseJsonResponse(raw)

  return { raw, parsed, modelName: MODEL, modelVersion: null }
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
