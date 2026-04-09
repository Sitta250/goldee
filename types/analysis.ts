/**
 * TypeScript types for the Today Gold Analysis feature.
 *
 * All text fields in the payload are bilingual: { th: string; en: string }.
 * Numeric comparison fields are always computed in backend code — never by the LLM.
 */

// ─── Bilingual text wrapper ───────────────────────────────────────────────────

export interface AnalysisText {
  th: string
  en: string
}

// ─── Payload schema (stored as JSON in GoldAnalysis.payload) ─────────────────

export interface PriceAnalysisSection {
  headline:     AnalysisText
  summary:      AnalysisText           // ≤80 words per language
  vs_yesterday: {
    direction:       'up' | 'down' | 'flat'
    absolute_change: number            // computed by backend, echoed by LLM
    percent_change:  number            // computed by backend, echoed by LLM
  }
  vs_7d: {
    direction:       'up' | 'down' | 'flat'
    absolute_change: number
    percent_change:  number
  }
}

export interface MarketDriver {
  theme:       AnalysisText
  impact_type: 'already_affecting' | 'could_affect'
  summary:     AnalysisText           // ≤50 words per language
  confidence:  'low' | 'medium' | 'high'
  source_count: number
}

export interface ExpertViewSection {
  overall_trend:      'bullish' | 'bearish' | 'mixed' | 'unclear'
  summary:            AnalysisText   // ≤70 words per language
  consensus_strength: 'low' | 'medium' | 'high'
}

// ─── Today view (มุมมองวันนี้) ──────────────────────────────────────────────
// Contextual framing of who this day's price action typically favours.
// NOT investment advice — framed as "เหมาะสำหรับ" (suitable for), never "ควร".

export type SuitableFor = 'buyers' | 'sellers' | 'waiting' | 'mixed'

export interface TodayViewSection {
  /** Derived from direction + price_signals, NOT from LLM judgment */
  suitable_for: SuitableFor
  /** ≤40 words per language. Neutral framing: context, not recommendation. */
  summary:      AnalysisText
}

export interface GoldAnalysisPayload {
  price_analysis:  PriceAnalysisSection
  /** Computed by backend, echoed by LLM. Optional for backwards compat with old DB records. */
  price_signals?:  PriceSignals
  market_drivers:  MarketDriver[]      // 2–4 items
  /**
   * "สิ่งที่ต้องจับตา" — 1–3 forward-looking bullets grounded in provided evidence.
   * Optional for backwards compat; required for all records generated after this schema version.
   */
  watch_list?:     AnalysisText[]
  /**
   * "มุมมองวันนี้" — who this type of day contextually favours.
   * Optional for backwards compat; required for all records generated after this schema version.
   */
  today_view?:     TodayViewSection
  expert_view:     ExpertViewSection
  disclaimer:      AnalysisText
}

// ─── Price signals (computed deterministically from snapshots, echoed by LLM) ──

export type TrendDirection = 'uptrend' | 'downtrend' | 'sideways'
export type Bias           = 'bullish' | 'bearish'  | 'neutral'

export interface PriceSignals {
  trend_direction: TrendDirection
  bias_today:      Bias
  bias_week:       Bias
}

// ─── Price facts (computed deterministically from DB snapshots) ───────────────

export interface PriceFacts {
  /** Price used as baseline (latest available snapshot) */
  currentPrice:           number      // THB per baht-weight (goldBarSell)
  priceTimestamp:         Date

  change_vs_yesterday_abs: number
  change_vs_yesterday_pct: number
  change_vs_7d_abs:        number
  change_vs_7d_pct:        number
  intraday_range_abs:      number

  direction_today: 'up' | 'down' | 'flat'
  direction_week:  'up' | 'down' | 'flat'

  /** Moving averages over daily closes (null when insufficient history) */
  ma_50:  number | null
  ma_200: number | null

  /** Derived trend / bias signals */
  trend_direction: TrendDirection
  bias_today:      Bias
  bias_week:       Bias
}

// ─── News item (output of fetch + rank pipeline) ──────────────────────────────

export interface NewsItem {
  title:       string
  summary:     string
  url:         string
  source:      string
  publishedAt: Date
  relevanceScore: number
}

// ─── Expert commentary item ───────────────────────────────────────────────────

export interface ExpertItem {
  expert:     string
  source:     string
  quote:      string
  url:        string
  publishedAt: Date
  authorityScore: number
}

// ─── Input bundle passed to the LLM ──────────────────────────────────────────

export interface AnalysisInputBundle {
  priceFacts:   PriceFacts
  newsItems:    NewsItem[]    // already ranked + deduped, max 12
  expertItems:  ExpertItem[]  // already ranked, max 5
}

// ─── Persisted analysis record (returned from DB queries) ────────────────────

export interface GoldAnalysisRecord {
  id:                    string
  generatedAt:           Date
  basedOnPriceTimestamp: Date
  basedOnNewsWindow:     string
  modelName:             string
  modelVersion:          string | null
  inputHash:             string
  runWindow:             'morning' | 'evening'
  payload:               GoldAnalysisPayload
  isValid:               boolean
  validationError:       string | null
}

// ─── Run window helpers ───────────────────────────────────────────────────────

export type RunWindow = 'morning' | 'evening'

/** Returns "morning" or "evening" for the given UTC+7 hour */
export function getRunWindow(utcPlusSevenHour: number): RunWindow {
  return utcPlusSevenHour < 14 ? 'morning' : 'evening'
}
