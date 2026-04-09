'use client'

import { useEffect, useRef } from 'react'
import { useLanguage }       from '@/contexts/LanguageContext'

const INTERVALS = [
  { value: '1D', labelTh: '1 วัน',   labelEn: '1D'  },
  { value: '1W', labelTh: '1 สัปดาห์', labelEn: '1W'  },
  { value: '1M', labelTh: '1 เดือน',  labelEn: '1M'  },
] as const

type Interval = (typeof INTERVALS)[number]['value']

import { useState } from 'react'

export function TechnicalAnalysisWidget() {
  const { lang }                      = useLanguage()
  const [interval, setInterval]       = useState<Interval>('1D')
  const containerRef                  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src   = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      interval,
      width:            '100%',
      isTransparent:    true,
      height:           425,
      symbol:           'TVC:GOLD',
      showIntervalTabs: false,
      displayMode:      'multiple',
      locale:           lang,
      colorTheme:       'light',
    })
    container.appendChild(script)

    return () => { container.innerHTML = '' }
  }, [interval, lang])

  return (
    <section
      aria-labelledby="technicals-heading"
      className="rounded-card bg-white border border-gray-100 shadow-card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="technicals-heading" className="text-sm font-semibold text-gray-800">
            {lang === 'th' ? 'สัญญาณเทคนิค' : 'Technical Signals'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === 'th'
              ? 'สรุปสัญญาณจาก Oscillators และ Moving Averages'
              : 'Summarizing what the indicators are suggesting'}
          </p>
        </div>

        {/* Interval toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                interval === iv.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {lang === 'th' ? iv.labelTh : iv.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Widget */}
      <div
        ref={containerRef}
        className="tradingview-widget-container -mx-1"
      />
    </section>
  )
}
