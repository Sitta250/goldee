import type { HistoryStats, HistoryTimeframe } from '@/lib/queries/history'
import { PriceChangeBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils/format'

interface StatCardsProps {
  stats: HistoryStats
  range: HistoryTimeframe
}

const RANGE_LABELS: Record<HistoryTimeframe, string> = {
  '7D':  '7 วันที่ผ่านมา',
  '30D': '30 วันที่ผ่านมา',
  '6M':  '6 เดือนที่ผ่านมา',
  '1Y':  '1 ปีที่ผ่านมา',
  'All': 'ทั้งหมด',
}

export function StatCards({ stats, range }: StatCardsProps) {
  const { latestBarSell, highBarSell, lowBarSell, changeAmount, changePercent } = stats
  const hasData = latestBarSell !== null

  if (!hasData) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        ยังไม่มีข้อมูลสำหรับช่วงเวลานี้
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">{RANGE_LABELS[range]} · ราคาทองแท่ง</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">

        {/* Latest */}
        <StatCard
          label="ราคาล่าสุด"
          value={`฿${formatPrice(latestBarSell!)}`}
          valueClass="text-gray-900"
        />

        {/* High */}
        <StatCard
          label="สูงสุด"
          value={highBarSell !== null ? `฿${formatPrice(highBarSell)}` : '—'}
          valueClass="text-green-700"
        />

        {/* Low */}
        <StatCard
          label="ต่ำสุด"
          value={lowBarSell !== null ? `฿${formatPrice(lowBarSell)}` : '—'}
          valueClass="text-red-700"
        />

        {/* Change — spans 2 cols on mobile for the badge */}
        <div className="col-span-2 sm:col-span-2 rounded-card bg-white border border-gray-100 shadow-card px-4 py-3 space-y-1.5">
          <p className="text-xs text-gray-400 leading-none">เปลี่ยนแปลง</p>
          {changeAmount !== null && changePercent !== null ? (
            <PriceChangeBadge delta={changeAmount} percent={changePercent} />
          ) : (
            <p className="text-base font-bold text-gray-400">—</p>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Single stat card ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueClass,
}: {
  label:      string
  value:      string
  valueClass: string
}) {
  return (
    <div className="rounded-card bg-white border border-gray-100 shadow-card px-4 py-3 space-y-1">
      <p className="text-xs text-gray-400 leading-none">{label}</p>
      <p className={`text-base font-bold tabular-nums leading-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}
