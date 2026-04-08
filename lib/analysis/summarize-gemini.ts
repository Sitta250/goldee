/**
 * Gemini 2.5 Flash summarizer.
 *
 * Constraints enforced here:
 * - Model: gemini-2.5-flash
 * - Secret: GEMINI_API_KEY only
 * - No tool use / browsing / research — text generation only
 * - Returns strict JSON matching GoldAnalysisPayload
 * - Bilingual output: every text field has { th, en } variants
 */

import type { AnalysisInputBundle, GoldAnalysisPayload } from '@/types/analysis'

const MODEL       = 'gemini-2.5-flash'
const GEMINI_URL  = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIMEOUT_MS  = 60_000

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildSystemInstruction(): string {
  return `You are a factual gold market summarizer.

Rules (strictly enforced):
1. Summarise ONLY the facts and evidence provided in the user message.
2. NEVER invent prices, dates, sources, experts, events, or statistics.
3. NEVER give investment advice. Do NOT use words: buy, sell, recommend, should invest, profitable.
4. Distinguish observed moves (already_affecting) from possible drivers (could_affect).
5. Use conservative language when evidence is mixed or weak.
6. Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON.
7. ALL text fields must contain BOTH Thai (th) and English (en) values.
8. Echo the numeric values from the provided priceFacts exactly — do not alter them.`
}

function buildUserPrompt(bundle: AnalysisInputBundle): string {
  const { priceFacts: pf, newsItems, expertItems } = bundle

  const newsBlock = newsItems.length > 0
    ? newsItems.map((n, i) =>
        `[N${i + 1}] "${n.title}" — ${n.source} (${n.publishedAt.toISOString().slice(0, 10)})\n${n.summary}`
      ).join('\n\n')
    : 'No recent gold news available.'

  const expertBlock = expertItems.length > 0
    ? expertItems.map((e, i) =>
        `[E${i + 1}] ${e.expert} (${e.source}, ${e.publishedAt.toISOString().slice(0, 10)}): "${e.quote}"`
      ).join('\n\n')
    : 'No expert commentary available.'

  return `=== PRICE FACTS (computed by backend, do not alter) ===
Current Thai gold bar sell price: ${pf.currentPrice.toFixed(2)} THB/baht-weight
vs Yesterday: ${pf.change_vs_yesterday_abs >= 0 ? '+' : ''}${pf.change_vs_yesterday_abs.toFixed(2)} THB (${pf.change_vs_yesterday_pct >= 0 ? '+' : ''}${pf.change_vs_yesterday_pct.toFixed(2)}%)
vs 7 days ago: ${pf.change_vs_7d_abs >= 0 ? '+' : ''}${pf.change_vs_7d_abs.toFixed(2)} THB (${pf.change_vs_7d_pct >= 0 ? '+' : ''}${pf.change_vs_7d_pct.toFixed(2)}%)
Intraday range: ${pf.intraday_range_abs.toFixed(2)} THB
Direction today: ${pf.direction_today}
Direction this week: ${pf.direction_week}

=== RECENT GOLD NEWS (max 12 items, ranked by relevance) ===
${newsBlock}

=== EXPERT COMMENTARY (allowlist sources only, max 5 items) ===
${expertBlock}

=== REQUIRED OUTPUT FORMAT (strict JSON, no markdown) ===
Return EXACTLY this structure. Every string field must have "th" (Thai) and "en" (English).
Word limits per language: price_analysis.summary ≤80 words, each market_drivers[].summary ≤50 words, expert_view.summary ≤70 words.

{
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

// ─── Gemini API call ──────────────────────────────────────────────────────────

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
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
      max_output_tokens: 2048,
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) throw new Error('Gemini returned empty response')

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
  stricterPrompt = false,
): Promise<SummarizeResult> {
  const systemInstruction = buildSystemInstruction()
  const userPrompt        = stricterPrompt
    ? buildUserPrompt(bundle) + '\n\nIMPORTANT: Return ONLY the JSON object. No additional text.'
    : buildUserPrompt(bundle)

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
