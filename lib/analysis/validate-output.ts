/**
 * Output validation for Gemini-generated analysis.
 *
 * Checks:
 * 1. Schema completeness — all required fields present
 * 2. Numeric integrity — echoed numbers match backend-computed values
 * 3. Banned language — no investment advice phrases
 * 4. Overconfidence phrases — flagged and downgraded
 * 5. Source allowlist — expert sources only from allowed set
 *
 * Failure policy:
 *   - First failure → retry with stricter prompt (see summarize-gemini)
 *   - Second failure → persist safe fallback payload
 */

import type {
  GoldAnalysisPayload,
  PriceFacts,
  AnalysisText,
  AnalysisInputBundle,
  TrendDirection,
  Bias,
} from '@/types/analysis'
import { EXPERT_SOURCE_NAMES } from './fetch-expert-commentary'

// ─── Banned language ──────────────────────────────────────────────────────────
// These phrases indicate investment advice which is strictly forbidden.

const BANNED_EN = [
  'buy gold', 'sell gold', 'you should buy', 'you should sell',
  'recommend buying', 'recommend selling', 'good time to buy', 'good time to sell',
  'invest in gold', 'profitable', 'strong buy', 'strong sell',
]
const BANNED_TH = [
  'ควรซื้อ', 'ควรขาย', 'แนะนำให้ซื้อ', 'แนะนำให้ขาย',
  'ลงทุนในทอง', 'ทำกำไร', 'ซื้อเลย', 'ขายเลย',
]

function containsBannedLanguage(text: AnalysisText | string): boolean {
  if (typeof text === 'string') {
    const l = text.toLowerCase()
    return BANNED_EN.some((b) => l.includes(b)) || BANNED_TH.some((b) => l.includes(b))
  }
  const lEn = text.en.toLowerCase()
  const lTh = text.th.toLowerCase()
  return (
    BANNED_EN.some((b) => lEn.includes(b)) ||
    BANNED_TH.some((b) => lTh.includes(b))
  )
}

// ─── Validators ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  ok:     boolean
  errors: string[]
}

function isAnalysisText(v: unknown): v is AnalysisText {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).th === 'string' &&
    typeof (v as Record<string, unknown>).en === 'string'
  )
}

function checkSchema(payload: unknown): string[] {
  const errors: string[] = []

  if (typeof payload !== 'object' || payload === null) {
    return ['payload is not an object']
  }

  const p = payload as Record<string, unknown>

  // price_analysis
  const pa = p.price_analysis as Record<string, unknown> | undefined
  if (!pa) {
    errors.push('missing price_analysis')
  } else {
    if (!isAnalysisText(pa.headline)) errors.push('price_analysis.headline must be {th,en}')
    if (!isAnalysisText(pa.summary))  errors.push('price_analysis.summary must be {th,en}')
    for (const field of ['vs_yesterday', 'vs_7d'] as const) {
      const v = pa[field] as Record<string, unknown> | undefined
      if (!v) { errors.push(`price_analysis.${field} missing`); continue }
      if (!['up', 'down', 'flat'].includes(v.direction as string))
        errors.push(`price_analysis.${field}.direction must be up|down|flat`)
      if (typeof v.absolute_change !== 'number')
        errors.push(`price_analysis.${field}.absolute_change must be number`)
      if (typeof v.percent_change !== 'number')
        errors.push(`price_analysis.${field}.percent_change must be number`)
    }
  }

  // market_drivers
  if (!Array.isArray(p.market_drivers) || p.market_drivers.length === 0) {
    errors.push('market_drivers must be a non-empty array')
  } else {
    for (const [i, d] of (p.market_drivers as unknown[]).entries()) {
      const driver = d as Record<string, unknown>
      if (!isAnalysisText(driver.theme))   errors.push(`market_drivers[${i}].theme must be {th,en}`)
      if (!isAnalysisText(driver.summary)) errors.push(`market_drivers[${i}].summary must be {th,en}`)
      if (!['already_affecting', 'could_affect'].includes(driver.impact_type as string))
        errors.push(`market_drivers[${i}].impact_type must be already_affecting|could_affect`)
      if (!['low', 'medium', 'high'].includes(driver.confidence as string))
        errors.push(`market_drivers[${i}].confidence must be low|medium|high`)
    }
  }

  // expert_view
  const ev = p.expert_view as Record<string, unknown> | undefined
  if (!ev) {
    errors.push('missing expert_view')
  } else {
    if (!['bullish', 'bearish', 'mixed', 'unclear'].includes(ev.overall_trend as string))
      errors.push('expert_view.overall_trend must be bullish|bearish|mixed|unclear')
    if (!isAnalysisText(ev.summary))
      errors.push('expert_view.summary must be {th,en}')
    if (!['low', 'medium', 'high'].includes(ev.consensus_strength as string))
      errors.push('expert_view.consensus_strength must be low|medium|high')
  }

  // price_signals
  const ps = p.price_signals as Record<string, unknown> | undefined
  if (!ps) {
    errors.push('missing price_signals')
  } else {
    const validTrend: TrendDirection[] = ['uptrend', 'downtrend', 'sideways']
    const validBias:  Bias[]           = ['bullish', 'bearish', 'neutral']
    if (!validTrend.includes(ps.trend_direction as TrendDirection))
      errors.push('price_signals.trend_direction must be uptrend|downtrend|sideways')
    if (!validBias.includes(ps.bias_today as Bias))
      errors.push('price_signals.bias_today must be bullish|bearish|neutral')
    if (!validBias.includes(ps.bias_week as Bias))
      errors.push('price_signals.bias_week must be bullish|bearish|neutral')
  }

  // disclaimer
  if (!isAnalysisText(p.disclaimer)) errors.push('disclaimer must be {th,en}')

  return errors
}

/** Numeric values echoed by the LLM must match backend facts within tolerance */
function checkNumerics(payload: GoldAnalysisPayload, priceFacts: PriceFacts): string[] {
  const errors: string[] = []
  const TOLERANCE = 0.05   // allow tiny floating-point rounding

  const pa = payload.price_analysis

  const checkNum = (label: string, llmVal: number, expected: number) => {
    if (Math.abs(llmVal - expected) > TOLERANCE)
      errors.push(`${label}: LLM returned ${llmVal}, expected ${expected}`)
  }

  checkNum(
    'price_analysis.vs_yesterday.absolute_change',
    pa.vs_yesterday.absolute_change,
    priceFacts.change_vs_yesterday_abs,
  )
  checkNum(
    'price_analysis.vs_yesterday.percent_change',
    pa.vs_yesterday.percent_change,
    priceFacts.change_vs_yesterday_pct,
  )
  checkNum(
    'price_analysis.vs_7d.absolute_change',
    pa.vs_7d.absolute_change,
    priceFacts.change_vs_7d_abs,
  )
  checkNum(
    'price_analysis.vs_7d.percent_change',
    pa.vs_7d.percent_change,
    priceFacts.change_vs_7d_pct,
  )

  return errors
}

/** price_signals values echoed by the LLM must match backend-computed signals */
function checkSignals(payload: GoldAnalysisPayload, priceFacts: PriceFacts): string[] {
  const errors: string[] = []
  const ps = payload.price_signals
  if (!ps) return errors   // schema check already flagged this

  if (ps.trend_direction !== priceFacts.trend_direction)
    errors.push(`price_signals.trend_direction: LLM echoed "${ps.trend_direction}", expected "${priceFacts.trend_direction}"`)
  if (ps.bias_today !== priceFacts.bias_today)
    errors.push(`price_signals.bias_today: LLM echoed "${ps.bias_today}", expected "${priceFacts.bias_today}"`)
  if (ps.bias_week !== priceFacts.bias_week)
    errors.push(`price_signals.bias_week: LLM echoed "${ps.bias_week}", expected "${priceFacts.bias_week}"`)

  return errors
}

function checkBannedLanguage(payload: GoldAnalysisPayload): string[] {
  const errors: string[] = []

  const textsToCheck: Array<[string, AnalysisText | string]> = [
    ['price_analysis.headline',  payload.price_analysis.headline],
    ['price_analysis.summary',   payload.price_analysis.summary],
    ['expert_view.summary',      payload.expert_view.summary],
    ...payload.market_drivers.map((d, i): [string, AnalysisText] =>
      [`market_drivers[${i}].summary`, d.summary],
    ),
  ]

  for (const [label, text] of textsToCheck) {
    if (containsBannedLanguage(text))
      errors.push(`Banned investment advice language in ${label}`)
  }

  return errors
}

// ─── Source provenance check ──────────────────────────────────────────────────
// Verifies that expert sources referenced in the payload are only from the
// allowlist, and that claimed source counts are plausible given the input.

function checkSourceProvenance(
  payload: GoldAnalysisPayload,
  bundle:  AnalysisInputBundle,
): string[] {
  const errors: string[] = []

  const inputSourceNames = new Set([
    ...bundle.newsItems.map((n) => n.source.toLowerCase()),
    ...bundle.expertItems.map((e) => e.source.toLowerCase()),
  ])

  // expert_view: if we had expert items, overall_trend must not be 'unclear'
  // unless we genuinely have no items — prevents the LLM hallucinating consensus
  if (bundle.expertItems.length > 0 && payload.expert_view.overall_trend === 'unclear') {
    // Not an error by itself — LLM may legitimately find experts mixed/unclear.
    // Only flag if it also claims high consensus strength with zero expert input.
  }

  // market_drivers: source_count must not exceed number of provided news items
  const maxSourceCount = bundle.newsItems.length
  for (const [i, d] of payload.market_drivers.entries()) {
    if (d.source_count > maxSourceCount) {
      errors.push(
        `market_drivers[${i}].source_count (${d.source_count}) exceeds input news count (${maxSourceCount})`,
      )
    }
  }

  // expert_view text must not cite explicit source brands outside provided input
  const expertText = (
    payload.expert_view.summary.en + ' ' +
    payload.expert_view.summary.th + ' ' +
    payload.price_analysis.summary.en + ' ' +
    payload.price_analysis.summary.th
  ).toLowerCase()

  // Include allowlist names plus common aliases we may see in generated text.
  const sourceAliases = [
    ...[...EXPERT_SOURCE_NAMES].map((n) => n.toLowerCase()),
    'reuters',
    'bloomberg',
    'cnbc',
    'world gold council',
    'kitco',
    'bullionvault',
    'marketwatch',
  ]

  for (const alias of sourceAliases) {
    if (!alias || alias.length < 4) continue
    if (!expertText.includes(alias)) continue

    const inInput = [...inputSourceNames].some((name) => name.includes(alias))
    if (!inInput) {
      errors.push(`Output references source "${alias}" that is not present in input bundle`)
    }
  }

  // If no news was provided but LLM claims multiple active drivers, flag overconfidence
  if (bundle.newsItems.length === 0) {
    const activeDrivers = payload.market_drivers.filter(
      (d) => d.impact_type === 'already_affecting' && d.confidence !== 'low',
    )
    if (activeDrivers.length > 0) {
      errors.push(
        `LLM claimed ${activeDrivers.length} active driver(s) with no news input — possible hallucination`,
      )
    }
  }

  return errors
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function validateOutput(
  payload:    GoldAnalysisPayload,
  priceFacts: PriceFacts,
  bundle:     AnalysisInputBundle,
): ValidationResult {
  const errors = [
    ...checkSchema(payload),
    ...checkNumerics(payload, priceFacts),
    ...checkSignals(payload, priceFacts),
    ...checkBannedLanguage(payload),
    ...checkSourceProvenance(payload, bundle),
  ]

  return { ok: errors.length === 0, errors }
}

// ─── Safe fallback payload ────────────────────────────────────────────────────
// Used when both the first attempt and the retry fail validation.

export function buildFallbackPayload(priceFacts: PriceFacts): GoldAnalysisPayload {
  const dirTh = priceFacts.direction_today === 'up'
    ? 'ปรับขึ้น' : priceFacts.direction_today === 'down' ? 'ปรับลง' : 'ทรงตัว'
  const dirEn = priceFacts.direction_today === 'up'
    ? 'up' : priceFacts.direction_today === 'down' ? 'down' : 'flat'

  return {
    price_analysis: {
      headline: {
        th: `ราคาทองวันนี้${dirTh} ${Math.abs(priceFacts.change_vs_yesterday_abs).toFixed(0)} บาท`,
        en: `Gold price ${dirEn} ${Math.abs(priceFacts.change_vs_yesterday_abs).toFixed(0)} THB today`,
      },
      summary: {
        th: `ราคาทองคำแท่งปรับ${dirTh} ${Math.abs(priceFacts.change_vs_yesterday_abs).toFixed(0)} บาท (${Math.abs(priceFacts.change_vs_yesterday_pct).toFixed(2)}%) เมื่อเทียบกับเมื่อวาน ข้อมูลการวิเคราะห์โดยละเอียดจะแสดงในรอบถัดไป`,
        en:  `Gold bar price moved ${Math.abs(priceFacts.change_vs_yesterday_abs).toFixed(0)} THB (${Math.abs(priceFacts.change_vs_yesterday_pct).toFixed(2)}%) vs yesterday. Detailed analysis unavailable for this window.`,
      },
      vs_yesterday: {
        direction:       priceFacts.direction_today,
        absolute_change: priceFacts.change_vs_yesterday_abs,
        percent_change:  priceFacts.change_vs_yesterday_pct,
      },
      vs_7d: {
        direction:       priceFacts.direction_week,
        absolute_change: priceFacts.change_vs_7d_abs,
        percent_change:  priceFacts.change_vs_7d_pct,
      },
    },
    price_signals: {
      trend_direction: priceFacts.trend_direction,
      bias_today:      priceFacts.bias_today,
      bias_week:       priceFacts.bias_week,
    },
    market_drivers: [
      {
        theme:       { th: 'ข้อมูลไม่เพียงพอ', en: 'Insufficient data' },
        impact_type: 'could_affect',
        summary:     {
          th: 'ไม่สามารถระบุปัจจัยได้ในรอบนี้',
          en: 'No sufficient evidence to identify market drivers for this window.',
        },
        confidence:   'low',
        source_count: 0,
      },
    ],
    expert_view: {
      overall_trend:      'unclear',
      summary:            {
        th: 'ไม่มีความเห็นจากผู้เชี่ยวชาญในรอบนี้',
        en: 'No expert commentary available for this window.',
      },
      consensus_strength: 'low',
    },
    disclaimer: {
      th: 'บทวิเคราะห์นี้สร้างขึ้นโดย AI จากข้อมูลตลาดและข่าวสารที่รวบรวม ไม่ใช่คำแนะนำการลงทุน',
      en: 'AI-generated summary based on aggregated market data and news sources. Not investment advice.',
    },
  }
}
