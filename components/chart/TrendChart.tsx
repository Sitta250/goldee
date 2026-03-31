'use client'

import { useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint, Timeframe } from '@/types/gold'
import { formatPrice, formatChartLabel } from '@/lib/utils/format'
import { TimeframeSelector } from './TimeframeSelector'

interface TrendChartProps {
  // Initial data for the default timeframe (1D), server-fetched
  initialData: ChartDataPoint[]
  initialRange?: Timeframe
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-card bg-white border border-gray-200 shadow-card-hover px-3 py-2 text-sm">
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 tabular-nums">
        ฿{formatPrice(payload[0].value)}
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrendChart({ initialData, initialRange = '1D' }: TrendChartProps) {
  const [range, setRange] = useState<Timeframe>(initialRange)
  const [data, setData] = useState<ChartDataPoint[]>(initialData)
  const [loading, setLoading] = useState(false)

  const handleRangeChange = useCallback(async (newRange: Timeframe) => {
    setRange(newRange)
    setLoading(true)
    try {
      const res = await fetch(`/api/prices/history?range=${newRange}`)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json.points)
    } catch {
      // Keep previous data on error; don't crash the chart
    } finally {
      setLoading(false)
    }
  }, [])

  // Format timestamps for the X-axis based on active range
  const chartData = data.map((p) => ({
    ...p,
    label: formatChartLabel(p.timestamp, range),
  }))

  return (
    <section
      aria-labelledby="chart-heading"
      className="rounded-card bg-white border border-gray-100 shadow-card p-4 space-y-4"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 id="chart-heading" className="text-sm font-semibold text-gray-700">
          แนวโน้มราคาทองคำแท่ง (ราคาขาย)
        </h2>
        <TimeframeSelector active={range} onChange={handleRangeChange} />
      </div>

      {/* Chart area */}
      <div
        className={`transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
        aria-hidden={loading}
      >
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            ยังไม่มีข้อมูลกราฟ
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `฿${(v / 1000).toFixed(0)}k`}
                width={48}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="barSell"
                stroke="#d4911a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#d4911a', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {loading && (
        <p className="text-xs text-center text-gray-400" aria-live="polite">
          กำลังโหลดข้อมูล…
        </p>
      )}
    </section>
  )
}
