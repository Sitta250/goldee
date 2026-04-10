'use client'

/**
 * GoldAnalysisCard — renders the 4-section structured AI briefing.
 *
 * Sections (matching the canonical Thai format):
 *   1. สถานะวันนี้  — direction chip + price movement summary
 *   2. เหตุผลหลัก  — market driver bullets
 *   3. สิ่งที่ต้องจับตา — watch list bullets (shown when present)
 *   4. มุมมองวันนี้  — today_view chip + framing
 */

import { useLanguage } from '@/contexts/LanguageContext'
import { DELTA_LABELS } from '@/lib/utils/copy'
import type {
  Bias,
  GoldAnalysisPayload,
  GoldAnalysisRecord,
  SuitableFor,
  TrendDirection,
} from '@/types/analysis'

// ─── Display helpers ──────────────────────────────────────────────────────────

const DIRECTION_LABEL: Record<string, Record<'th' | 'en', string>> = {
  up:   { th: 'ขึ้น',    en: 'Up'   },
  down: { th: 'ลง',     en: 'Down' },
  flat: { th: 'ทรงตัว', en: 'Flat' },
}

const DIRECTION_CLASS: Record<string, string> = {
  up:   'bg-green-50 text-green-700 border-green-200',
  down: 'bg-red-50 text-red-600 border-red-200',
  flat: 'bg-gray-50 text-gray-500 border-gray-200',
}

const DIRECTION_ICON: Record<string, string> = {
  up: '↑', down: '↓', flat: '→',
}

const TREND_LABEL: Record<TrendDirection, Record<'th' | 'en', string>> = {
  uptrend:   { th: 'ขาขึ้น',  en: 'Uptrend'  },
  downtrend: { th: 'ขาลง',    en: 'Downtrend' },
  sideways:  { th: 'ทรงตัว',  en: 'Sideways'  },
}

const BIAS_LABEL: Record<Bias, Record<'th' | 'en', string>> = {
  bullish: { th: 'บวก',      en: 'Bullish' },
  bearish: { th: 'ลบ',       en: 'Bearish' },
  neutral: { th: 'เป็นกลาง', en: 'Neutral' },
}

const BIAS_CLASS: Record<Bias, string> = {
  bullish: 'bg-green-50 text-green-700 border-green-100',
  bearish: 'bg-red-50 text-red-600 border-red-100',
  neutral: 'bg-gray-50 text-gray-500 border-gray-100',
}

const SUITABLE_FOR_LABEL: Record<SuitableFor, Record<'th' | 'en', string>> = {
  buyers:  { th: 'เหมาะกับคนซื้อ',       en: 'Favours buyers'  },
  sellers: { th: 'เหมาะกับคนขาย',        en: 'Favours sellers' },
  waiting: { th: 'เหมาะกับคนรอดูก่อน',   en: 'Wait and watch'  },
  mixed:   { th: 'ขึ้นอยู่กับสถานการณ์', en: 'Mixed signals'   },
}

const SUITABLE_FOR_CLASS: Record<SuitableFor, string> = {
  buyers:  'bg-green-50 text-green-700 border-green-200',
  sellers: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting: 'bg-gray-50 text-gray-500 border-gray-200',
  mixed:   'bg-blue-50 text-blue-600 border-blue-200',
}

const CONFIDENCE_DOT: Record<string, string> = {
  high:   'bg-green-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}

/**
 * Derive overall input confidence from what the LLM echoed back.
 * This is deterministic — no extra DB field needed.
 * - 'low'    → all drivers low confidence AND expert consensus low
 * - 'medium' → mixed signals
 * - 'high'   → at least one high-confidence driver or strong expert consensus
 */
function deriveInputConfidence(payload: GoldAnalysisPayload): 'high' | 'medium' | 'low' {
  const allDriversLow = payload.market_drivers.every((d) => d.confidence === 'low')
  const expertLow     = payload.expert_view.consensus_strength === 'low'
  if (allDriversLow && expertLow) return 'low'

  const anyHigh =
    payload.market_drivers.some((d) => d.confidence === 'high') ||
    payload.expert_view.consensus_strength === 'high'
  return anyHigh ? 'high' : 'medium'
}

function formatDate(d: Date, lang: 'th' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
      {children}
    </p>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoldAnalysisCardProps {
  analysis: GoldAnalysisRecord
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GoldAnalysisCard({ analysis }: GoldAnalysisCardProps) {
  const { lang, t } = useLanguage()
  const { payload, generatedAt, isValid } = analysis
  const inputConfidence = deriveInputConfidence(payload)
  const { price_analysis: pa, market_drivers, expert_view, disclaimer } = payload
  const signals   = payload.price_signals
  const watchList = payload.watch_list
  const todayView = payload.today_view

  const dir      = pa.vs_yesterday.direction
  const absChg   = pa.vs_yesterday.absolute_change
  const pctChg   = pa.vs_yesterday.percent_change
  const sign     = absChg >= 0 ? '+' : ''

  const labelUpdated      = lang === 'th' ? 'วิเคราะห์เมื่อ'      : 'Analysed'
  const labelAiDisclaimer = lang === 'th'
    ? 'สรุปโดย AI จากข้อมูลตลาดและแหล่งข่าว ไม่ใช่คำแนะนำการลงทุน'
    : 'AI summary from market data and news sources. Not investment advice.'

  return (
    <section
      aria-labelledby="gold-analysis-heading"
      className="rounded-card bg-white border border-gray-100 shadow-card overflow-hidden"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="gold-analysis-heading"
            className="text-sm font-semibold text-gray-700 leading-snug"
          >
            {t(pa.headline)}
          </h2>
          {/* Current change — grounds the AI text in the hero's numbers */}
          <span className={`shrink-0 text-sm font-bold tabular-nums px-2 py-1 rounded-full border ${DIRECTION_CLASS[dir] ?? DIRECTION_CLASS.flat}`}>
            {DIRECTION_ICON[dir]} {sign}{absChg.toFixed(0)} ({sign}{pctChg.toFixed(2)}%)
          </span>
        </div>

        {/* Signal badges — compact row */}
        {signals && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[11px] text-gray-400 self-center">
              {lang === 'th' ? 'แนวโน้ม:' : 'Trend:'}
            </span>
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${BIAS_CLASS[signals.bias_today] ?? BIAS_CLASS.neutral}`}>
              {TREND_LABEL[signals.trend_direction]?.[lang]}
            </span>
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${BIAS_CLASS[signals.bias_today] ?? BIAS_CLASS.neutral}`}>
              {lang === 'th' ? 'วันนี้ ' : 'Today: '}{BIAS_LABEL[signals.bias_today]?.[lang]}
            </span>
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${BIAS_CLASS[signals.bias_week] ?? BIAS_CLASS.neutral}`}>
              {lang === 'th' ? '7 วัน ' : '7d: '}{BIAS_LABEL[signals.bias_week]?.[lang]}
            </span>
          </div>
        )}
      </div>

      {/* ── Section 1: สถานะวันนี้ ─────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <SectionHeading>
          {lang === 'th' ? 'สถานะวันนี้' : "Today's Status"}
        </SectionHeading>
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block rounded-full border px-3 py-0.5 text-sm font-semibold ${DIRECTION_CLASS[dir] ?? DIRECTION_CLASS.flat}`}>
            {DIRECTION_ICON[dir]} {DIRECTION_LABEL[dir]?.[lang] ?? dir}
          </span>
          {/* 7-day context */}
          <span className="text-xs text-gray-400">
            {DELTA_LABELS.vs7d[lang]}{': '}
            <span className={pa.vs_7d.direction === 'up' ? 'text-green-600' : pa.vs_7d.direction === 'down' ? 'text-red-500' : 'text-gray-500'}>
              {pa.vs_7d.absolute_change >= 0 ? '+' : ''}{pa.vs_7d.absolute_change.toFixed(0)}
            </span>
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-[1.8]">{t(pa.summary)}</p>
      </div>

      {/* ── Section 2: เหตุผลหลัก ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <SectionHeading>
          {lang === 'th' ? 'ปัจจัยที่ส่งผลต่อราคา' : 'Price Drivers'}
        </SectionHeading>
        <ul className="space-y-2.5">
          {market_drivers.map((driver, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${CONFIDENCE_DOT[driver.confidence] ?? 'bg-gray-300'}`}
                title={`${lang === 'th' ? 'ความน่าเชื่อถือ' : 'Confidence'}: ${driver.confidence}`}
              />
              <p className="text-sm text-gray-700 leading-relaxed">{t(driver.summary)}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Section 3: สิ่งที่ต้องจับตา ─────────────────────────────────────── */}
      {watchList && watchList.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-50">
          <SectionHeading>
            {lang === 'th' ? 'ปัจจัยที่ต้องติดตาม' : 'Factors to Watch'}
          </SectionHeading>
          <ul className="space-y-1.5">
            {watchList.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                <span className="shrink-0 text-gray-300 mt-0.5">▸</span>
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Section 4: มุมมองวันนี้ ─────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <SectionHeading>
          {lang === 'th' ? 'วิเคราะห์วันนี้' : "Today's Analysis"}
        </SectionHeading>
        {todayView ? (
          <>
            <span className={`inline-block rounded-full border px-3 py-0.5 text-sm font-semibold mb-2 ${SUITABLE_FOR_CLASS[todayView.suitable_for]}`}>
              {SUITABLE_FOR_LABEL[todayView.suitable_for]?.[lang]}
            </span>
            <p className="text-sm text-gray-700 leading-relaxed">{t(todayView.summary)}</p>
          </>
        ) : (
          /* Fallback for old records without today_view — show expert_view */
          <>
            <p className="text-sm text-gray-700 leading-relaxed">{t(expert_view.summary)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'th'
                ? `ความเชื่อมั่นนักวิเคราะห์: ${expert_view.consensus_strength}`
                : `Expert consensus: ${expert_view.consensus_strength}`}
            </p>
          </>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 bg-gray-50 space-y-1">
        {!isValid && (
          <p className="text-[11px] text-amber-600 mb-1">
            {lang === 'th'
              ? '⚠ ข้อมูลอาจไม่ครบถ้วน — แสดงสรุปพื้นฐาน'
              : '⚠ Detailed analysis unavailable — showing basic summary'}
          </p>
        )}
        {isValid && inputConfidence === 'low' && (
          <p className="text-[11px] text-amber-600 mb-1">
            {lang === 'th'
              ? '⚠ ข้อมูลประกอบจำกัด — ใช้ดุลยพินิจในการตัดสินใจ'
              : '⚠ Limited supporting data — use your own judgement'}
          </p>
        )}
        <p className="text-[11px] text-gray-400">
          {labelUpdated}: {formatDate(generatedAt, lang)}
        </p>
        <p className="text-[10px] text-gray-400 italic">{labelAiDisclaimer}</p>
        <p className="text-[10px] text-gray-400 italic">{t(disclaimer)}</p>
      </div>
    </section>
  )
}
