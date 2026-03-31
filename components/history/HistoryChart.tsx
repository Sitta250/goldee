'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HistoryChartPoint, MetricKey, HistoryTimeframe } from '@/lib/queries/history'
import { formatPrice, formatChartLabel } from '@/lib/utils/format'

// ─── Metric config ─────────────────────────────────────────────────────────────

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'barSell',     label: 'แท่ง ขาย' },
  { key: 'barBuy',      label: 'แท่ง ซื้อ' },
  { key: 'jewelrySell', label: 'รูปพรรณ ขาย' },
  { key: 'jewelryBuy',  label: 'รูปพรรณ ซื้อ' },
]

const METRIC_LABELS: Record<MetricKey, string> = {
  barSell:     'ราคาทองแท่ง (ขาย)',
  barBuy:      'ราคาทองแท่ง (ซื้อ)',
  jewelrySell: 'ราคาทองรูปพรรณ (ขาย)',
  jewelryBuy:  'ราคาทองรูปพรรณ (ซื้อ)',
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

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
      <p className="text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 tabular-nums">
        ฿{formatPrice(payload[0].value)}
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HistoryChartProps {
  data:        HistoryChartPoint[]
  activeRange: HistoryTimeframe
}

export function HistoryChart({ data, activeRange }: HistoryChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('barSell')

  const chartData = data.map((p) => ({
    ...p,
    label: formatChartLabel(p.timestamp, activeRange),
    value: p[activeMetric],
  }))

  return (
    <div className="space-y-3">

      {/* Metric toggle */}
      <div
        role="group"
        aria-label="เลือกราคาที่แสดงในกราฟ"
        className="flex flex-wrap gap-1.5"
      >
        {METRICS.map(({ key, label }) => {
          const isActive = activeMetric === key
          return (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              aria-pressed={isActive}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Chart — responsive height via CSS, Recharts fills 100% */}
      {data.length === 0 ? (
        <div
          role="img"
          aria-label="ยังไม่มีข้อมูลกราฟสำหรับช่วงเวลานี้"
          className="flex items-center justify-center h-[180px] sm:h-[260px] text-sm text-gray-400 bg-gray-50 rounded-lg"
        >
          ยังไม่มีข้อมูลกราฟสำหรับช่วงเวลานี้
        </div>
      ) : (
        <div
          role="img"
          aria-label={`กราฟ${METRIC_LABELS[activeMetric]}`}
          className="h-[180px] sm:h-[260px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1_000).toFixed(0)}k`}
                width={36}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#d4911a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#d4911a', strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
