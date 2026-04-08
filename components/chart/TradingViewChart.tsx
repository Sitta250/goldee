'use client'

import { useEffect, useRef, useState } from 'react'

const SYMBOLS = [
  { id: 'XAUUSD',                                  label: 'XAU/USD',  desc: 'ราคาทองโลก (USD)' },
  { id: 'TVC:GOLD*FX_IDC:USDTHB*0.47295227',      label: 'GOLD965',  desc: 'ทองคำแท่ง 96.5% (THB)' },
] as const

type SymbolId = (typeof SYMBOLS)[number]['id']

export function TradingViewChart() {
  const [symbol, setSymbol] = useState<SymbolId>('XAUUSD')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: false,
      width: '100%',
      height: 650,
      symbol,
      interval: 'D',
      timezone: 'Asia/Bangkok',
      theme: 'light',
      style: '1',
      locale: 'th',
      allow_symbol_change: false,
      support_host: 'https://www.tradingview.com',
    })
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [symbol])

  const active = SYMBOLS.find((s) => s.id === symbol)!

  return (
    <section
      aria-labelledby="chart-heading"
      className="rounded-card bg-white border border-gray-100 shadow-card p-4 space-y-3"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 id="chart-heading" className="text-sm font-semibold text-gray-700">
            กราฟราคาทองคำ — {active.desc}
          </h2>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
          {SYMBOLS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSymbol(s.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                symbol === s.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: '650px', width: '100%' }}
      />
    </section>
  )
}
