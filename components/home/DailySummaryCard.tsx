'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { UI, s }       from '@/lib/i18n/ui-strings'
import { formatPrice } from '@/lib/utils/format'

interface DailySummaryCardProps {
  summaryTh: string
  highBarSell?: number | null
  lowBarSell?: number | null
  openBarSell?: number | null
  closeBarSell?: number | null
}

export function DailySummaryCard({
  summaryTh,
  highBarSell,
  lowBarSell,
  openBarSell,
  closeBarSell,
}: DailySummaryCardProps) {
  const { lang } = useLanguage()
  const hasPriceData = highBarSell || lowBarSell || openBarSell || closeBarSell

  const ohlcLabels = [
    { key: 'open',  labelObj: UI.dailySummary.open,  value: openBarSell  },
    { key: 'close', labelObj: UI.dailySummary.close, value: closeBarSell },
    { key: 'high',  labelObj: UI.dailySummary.high,  value: highBarSell  },
    { key: 'low',   labelObj: UI.dailySummary.low,   value: lowBarSell   },
  ]

  return (
    <section
      aria-labelledby="daily-summary-heading"
      className="rounded-card bg-white border border-gray-100 shadow-card p-5 space-y-4"
    >
      <h2 id="daily-summary-heading" className="text-sm font-semibold text-gray-600">
        {s(UI.dailySummary.heading, lang)}
      </h2>

      {/* Plain-language summary — Thai only (content is Thai text from DB) */}
      <p className="text-sm text-gray-700 leading-[1.8]">{summaryTh}</p>

      {/* OHLC data row — only shown when data exists */}
      {hasPriceData && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-50">
          {ohlcLabels.map(({ key, labelObj, value }) =>
            value != null ? (
              <div key={key} className="text-center">
                <dt className="text-xs text-gray-400">{s(labelObj, lang)}</dt>
                <dd className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                  ฿{formatPrice(value)}
                </dd>
              </div>
            ) : null,
          )}
        </dl>
      )}
    </section>
  )
}
