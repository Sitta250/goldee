'use client'

/**
 * GoldAnalysisCard — Today Gold Analysis rendered on the homepage.
 *
 * Switches between Thai and English instantly via LanguageContext.
 * Two sections:
 *   1. Thai Gold Today — local price movement recap
 *   2. Global Drivers  — world events + expert commentary
 */

import { useLanguage } from '@/contexts/LanguageContext'
import type { Bias, GoldAnalysisRecord, TrendDirection } from '@/types/analysis'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TREND_ICON: Record<TrendDirection, string> = {
  uptrend:   '↑',
  downtrend: '↓',
  sideways:  '→',
}

const DIRECTION_ICON: Record<string, string> = {
  up:   '↑',
  down: '↓',
  flat: '→',
}

const DIRECTION_CLASS: Record<string, string> = {
  up:   'text-green-600',
  down: 'text-red-500',
  flat: 'text-gray-500',
}

const CONFIDENCE_DOT: Record<string, string> = {
  high:   'bg-green-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}

const IMPACT_LABEL: Record<string, Record<string, string>> = {
  already_affecting: { th: 'ส่งผลแล้ว', en: 'Active' },
  could_affect:      { th: 'อาจส่งผล', en: 'Possible' },
}

function formatDate(d: Date, lang: 'th' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoldAnalysisCardProps {
  analysis: GoldAnalysisRecord
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GoldAnalysisCard({ analysis }: GoldAnalysisCardProps) {
  const { lang, t } = useLanguage()
  const { payload, generatedAt, isValid } = analysis
  const { price_analysis: pa, market_drivers, expert_view, disclaimer } = payload

  const dirIcon     = DIRECTION_ICON[pa.vs_yesterday.direction] ?? '→'
  const dirClass    = DIRECTION_CLASS[pa.vs_yesterday.direction] ?? 'text-gray-500'
  const signals     = payload.price_signals

  const headingPriceSection  = lang === 'th' ? 'ราคาทองไทยวันนี้'  : 'Thai Gold Today'
  const headingGlobalSection = lang === 'th' ? 'ปัจจัยตลาดโลก'     : 'Global Drivers'
  const headingExpertSection = lang === 'th' ? 'มุมมองผู้เชี่ยวชาญ' : 'Expert View'
  const labelUpdated         = lang === 'th' ? 'อัพเดทล่าสุด'       : 'Last updated'
  const labelAiDisclaimer    = lang === 'th'
    ? 'สรุปโดย AI จากข้อมูลตลาดและแหล่งข่าว'
    : 'AI-generated summary based on aggregated market data and news sources'

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
            className="text-base font-semibold text-gray-900"
          >
            {t(pa.headline)}
          </h2>
          <span className={`shrink-0 text-lg font-bold tabular-nums ${dirClass}`}>
            {dirIcon} {pa.vs_yesterday.absolute_change >= 0 ? '+' : ''}
            {pa.vs_yesterday.absolute_change.toFixed(0)}
          </span>
        </div>

        {/* Change badges */}
        <div className="mt-2 flex flex-wrap gap-2">
          <ChangeBadge
            label={lang === 'th' ? 'เทียบเมื่อวาน' : 'vs Yesterday'}
            dir={pa.vs_yesterday.direction}
            abs={pa.vs_yesterday.absolute_change}
            pct={pa.vs_yesterday.percent_change}
          />
          <ChangeBadge
            label={lang === 'th' ? 'เทียบ 7 วัน' : 'vs 7 days'}
            dir={pa.vs_7d.direction}
            abs={pa.vs_7d.absolute_change}
            pct={pa.vs_7d.percent_change}
          />
        </div>

        {/* Signal badges */}
        {signals && (
          <div className="mt-2 flex flex-wrap gap-2">
            <TrendDirectionBadge trend={signals.trend_direction} lang={lang} />
            <BiasBadge
              label={lang === 'th' ? 'วันนี้' : 'Today'}
              bias={signals.bias_today}
              lang={lang}
            />
            <BiasBadge
              label={lang === 'th' ? '1 สัปดาห์' : '1 week'}
              bias={signals.bias_week}
              lang={lang}
            />
          </div>
        )}
      </div>

      {/* ── Section 1: Thai Gold Today ───────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <SectionLabel>{headingPriceSection}</SectionLabel>
        <p className="text-sm text-gray-700 leading-[1.8] mt-1">{t(pa.summary)}</p>
        <div className="flex justify-end mt-2">
          <SourceAvatars sources={SOURCES_THAI_GOLD} />
        </div>
      </div>

      {/* ── Section 2: Global Drivers ────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <SectionLabel>{headingGlobalSection}</SectionLabel>
        <ul className="space-y-2.5 mt-2">
          {market_drivers.map((driver, i) => (
            <li key={i} className="flex gap-2.5">
              {/* Confidence dot */}
              <span
                className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${CONFIDENCE_DOT[driver.confidence] ?? 'bg-gray-300'}`}
                title={`Confidence: ${driver.confidence}`}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-gray-800">
                    {t(driver.theme)}
                  </span>
                  <ImpactBadge impactType={driver.impact_type} lang={lang} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t(driver.summary)}
                </p>
                {driver.source_count > 0 && (
                  <span className="text-[10px] text-gray-400">
                    {driver.source_count}{' '}
                    {lang === 'th' ? 'แหล่งข้อมูล' : 'source' + (driver.source_count > 1 ? 's' : '')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-end mt-3">
          <SourceAvatars sources={SOURCES_GLOBAL_DRIVERS} />
        </div>
      </div>

      {/* ── Section 3: Expert View ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-1">
          <SectionLabel>{headingExpertSection}</SectionLabel>
          <TrendBadge trend={expert_view.overall_trend} lang={lang} />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{t(expert_view.summary)}</p>
        <div className="flex justify-end mt-2">
          <SourceAvatars sources={SOURCES_EXPERT_VIEW} />
        </div>
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
        <p className="text-[11px] text-gray-400">
          {labelUpdated}: {formatDate(generatedAt, lang)}
        </p>
        <p className="text-[10px] text-gray-400 italic">{labelAiDisclaimer}</p>
        <p className="text-[10px] text-gray-400 italic">{t(disclaimer)}</p>
      </div>
    </section>
  )
}

// ─── Source definitions per section ──────────────────────────────────────────

interface SourceDef { name: string; domain: string }

const SOURCES_THAI_GOLD: SourceDef[] = [
  { name: 'CHNWT',   domain: 'chnwt.dev' },
]

const SOURCES_GLOBAL_DRIVERS: SourceDef[] = [
  { name: 'Kitco',      domain: 'kitco.com' },
  { name: 'Reuters',    domain: 'reuters.com' },
  { name: 'MarketWatch', domain: 'marketwatch.com' },
]

const SOURCES_EXPERT_VIEW: SourceDef[] = [
  { name: 'World Gold Council', domain: 'gold.org' },
  { name: 'Kitco Commentary',   domain: 'kitco.com' },
  { name: 'BullionVault',       domain: 'bullionvault.com' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold tracking-wide text-gray-800">
      {children}
    </p>
  )
}

function SourceAvatars({ sources }: { sources: SourceDef[] }) {
  return (
    <div className="flex items-center">
      {sources.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src.domain + i}
          src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
          alt={src.name}
          title={src.name}
          width={20}
          height={20}
          className="w-5 h-5 rounded-full ring-2 ring-white bg-gray-100 object-cover"
          style={{ marginLeft: i > 0 ? '-6px' : 0 }}
        />
      ))}
    </div>
  )
}

interface ChangeBadgeProps {
  label: string
  dir:   string
  abs:   number
  pct:   number
}

function ChangeBadge({ label, dir, abs, pct }: ChangeBadgeProps) {
  const cls = dir === 'up'
    ? 'bg-green-50 text-green-700 border-green-100'
    : dir === 'down'
    ? 'bg-red-50 text-red-600 border-red-100'
    : 'bg-gray-50 text-gray-500 border-gray-100'

  const sign = abs >= 0 ? '+' : ''

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}: {sign}{abs.toFixed(0)} ({sign}{pct.toFixed(2)}%)
    </span>
  )
}

function ImpactBadge({ impactType, lang }: { impactType: string; lang: 'th' | 'en' }) {
  const label = IMPACT_LABEL[impactType]?.[lang] ?? impactType
  const cls = impactType === 'already_affecting'
    ? 'bg-amber-50 text-amber-700 border-amber-100'
    : 'bg-blue-50 text-blue-600 border-blue-100'

  return (
    <span className={`inline-block rounded border px-1.5 py-0 text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  )
}

function TrendDirectionBadge({ trend, lang }: { trend: TrendDirection; lang: 'th' | 'en' }) {
  const labels: Record<TrendDirection, Record<'th' | 'en', string>> = {
    uptrend:   { th: 'ขาขึ้น',  en: 'Uptrend'   },
    downtrend: { th: 'ขาลง',    en: 'Downtrend'  },
    sideways:  { th: 'ทรงตัว',  en: 'Sideways'   },
  }
  const classes: Record<TrendDirection, string> = {
    uptrend:   'bg-green-50 text-green-700 border-green-100',
    downtrend: 'bg-red-50 text-red-600 border-red-100',
    sideways:  'bg-gray-50 text-gray-500 border-gray-100',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium ${classes[trend]}`}>
      <span aria-hidden>{TREND_ICON[trend]}</span>
      {labels[trend][lang]}
    </span>
  )
}

function BiasBadge({ label, bias, lang }: { label: string; bias: Bias; lang: 'th' | 'en' }) {
  const biasLabels: Record<Bias, Record<'th' | 'en', string>> = {
    bullish: { th: 'บวก',    en: 'Bullish' },
    bearish: { th: 'ลบ',     en: 'Bearish' },
    neutral: { th: 'เป็นกลาง', en: 'Neutral' },
  }
  const classes: Record<Bias, string> = {
    bullish: 'bg-green-50 text-green-700 border-green-100',
    bearish: 'bg-red-50 text-red-600 border-red-100',
    neutral: 'bg-gray-50 text-gray-500 border-gray-100',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium ${classes[bias]}`}>
      <span className="text-gray-400">{label}:</span>
      {biasLabels[bias][lang]}
    </span>
  )
}

function TrendBadge({ trend, lang }: { trend: string; lang: 'th' | 'en' }) {
  const labels: Record<string, Record<string, string>> = {
    bullish:  { th: 'ขาขึ้น',    en: 'Bullish' },
    bearish:  { th: 'ขาลง',      en: 'Bearish' },
    mixed:    { th: 'ผสม',        en: 'Mixed'   },
    unclear:  { th: 'ไม่ชัดเจน', en: 'Unclear' },
  }
  const classes: Record<string, string> = {
    bullish: 'bg-green-50 text-green-700 border-green-100',
    bearish: 'bg-red-50 text-red-600 border-red-100',
    mixed:   'bg-amber-50 text-amber-700 border-amber-100',
    unclear: 'bg-gray-50 text-gray-500 border-gray-100',
  }

  return (
    <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${classes[trend] ?? classes.unclear}`}>
      {labels[trend]?.[lang] ?? trend}
    </span>
  )
}
