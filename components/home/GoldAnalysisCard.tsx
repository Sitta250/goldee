'use client'

/**
 * GoldAnalysisCard — renders the 4-section structured AI briefing.
 *
 * Sections (matching the canonical Thai format):
 *   1. สถานะวันนี้        — direction chip + price movement summary
 *   2. ปัจจัยที่ส่งผลต่อราคา — market driver bullets
 *   3. ปัจจัยที่ต้องติดตาม  — watch list bullets (shown when present)
 *   4. ติดตามข่าวทองประจำวัน — today_view summary in news-feed style
 */

import {
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DELTA_LABELS } from '@/lib/utils/copy'
import type {
  Bias,
  GoldAnalysisPayload,
  GoldAnalysisRecord,
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

const CONFIDENCE_DOT: Record<string, string> = {
  high:   'bg-green-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}

// ─── Direction icon component (replaces ↑↓→ string map) ──────────────────────

function DirectionIcon({ dir, size = 13 }: { dir: string; size?: number }) {
  if (dir === 'up')   return <TrendingUp   size={size} className="inline shrink-0" aria-hidden />
  if (dir === 'down') return <TrendingDown  size={size} className="inline shrink-0" aria-hidden />
  return <Minus size={size} className="inline shrink-0" aria-hidden />
}

// ─── Input confidence helper ──────────────────────────────────────────────────
// Derived deterministically from the LLM-echoed payload — no extra DB field.

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

  const dir    = pa.vs_yesterday.direction
  const absChg = pa.vs_yesterday.absolute_change
  const pctChg = pa.vs_yesterday.percent_change
  const sign   = absChg >= 0 ? '+' : ''

  const labelUpdated      = lang === 'th' ? 'วิเคราะห์เมื่อ' : 'Analysed'
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
          <span className={`shrink-0 inline-flex items-center gap-1 text-sm font-bold tabular-nums px-2 py-1 rounded-full border ${DIRECTION_CLASS[dir] ?? DIRECTION_CLASS.flat}`}>
            <DirectionIcon dir={dir} size={13} />
            {sign}{absChg.toFixed(0)} ({sign}{pctChg.toFixed(2)}%)
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
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-sm font-semibold ${DIRECTION_CLASS[dir] ?? DIRECTION_CLASS.flat}`}>
            <DirectionIcon dir={dir} size={14} />
            {DIRECTION_LABEL[dir]?.[lang] ?? dir}
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

      {/* ── Section 2: ปัจจัยที่ส่งผลต่อราคา ──────────────────────────────── */}
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

      {/* ── Section 3: ปัจจัยที่ต้องติดตาม ────────────────────────────────── */}
      {watchList && watchList.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-50">
          <SectionHeading>
            {lang === 'th' ? 'ปัจจัยที่ต้องติดตาม' : 'Factors to Watch'}
          </SectionHeading>
          <ul className="space-y-1.5">
            {watchList.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                <ChevronRight size={14} className="shrink-0 text-gray-300 mt-0.5" aria-hidden />
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Section 4: ติดตามข่าวทองประจำวัน ──────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <SectionHeading>
          {lang === 'th' ? 'ติดตามข่าวทองประจำวัน' : "Today's Gold Briefing"}
        </SectionHeading>
        {todayView ? (
          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Lightbulb size={16} className="text-amber-500" aria-hidden />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(todayView.summary)}
              </p>
            </div>
          </div>
        ) : (
          /* Fallback for old records without today_view */
          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Lightbulb size={16} className="text-amber-500" aria-hidden />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm text-gray-600 leading-relaxed">{t(expert_view.summary)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {lang === 'th'
                  ? `ความเชื่อมั่นนักวิเคราะห์: ${expert_view.consensus_strength}`
                  : `Expert consensus: ${expert_view.consensus_strength}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 bg-gray-50 space-y-1">
        {!isValid && (
          <p className="flex items-center gap-1 text-[11px] text-amber-600 mb-1">
            <AlertTriangle size={11} className="shrink-0" aria-hidden />
            {lang === 'th'
              ? 'ข้อมูลอาจไม่ครบถ้วน — แสดงสรุปพื้นฐาน'
              : 'Detailed analysis unavailable — showing basic summary'}
          </p>
        )}
        {isValid && inputConfidence === 'low' && (
          <p className="flex items-center gap-1 text-[11px] text-amber-600 mb-1">
            <AlertTriangle size={11} className="shrink-0" aria-hidden />
            {lang === 'th'
              ? 'ข้อมูลประกอบจำกัด — ใช้ดุลยพินิจในการตัดสินใจ'
              : 'Limited supporting data — use your own judgement'}
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
