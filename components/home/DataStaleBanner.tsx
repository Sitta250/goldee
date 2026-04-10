import { formatThaiPollingWindowRangeTh } from '@/lib/utils/thai-market-hours'

/**
 * DataStaleBanner — during the Thai polling window, warns if `lastSeenAt` is
 * older than STALE_THRESHOLD_MS. Outside the window, shows neutral copy instead
 * of an amber “stale” alert (overnight gaps are expected).
 *
 * Uses `lastSeenAt` (last successful poll confirmation) rather than `fetchedAt`.
 */

// ~3× the 5-min ingest interval — allows two missed runs before warning.
const STALE_THRESHOLD_MS = 15 * 60 * 1000

interface DataStaleBannerProps {
  lastSeenAt: Date
  /** From server: isThaiGoldPollingWindow() at render time */
  isWithinPollingWindow: boolean
}

export function DataStaleBanner({
  lastSeenAt,
  isWithinPollingWindow,
}: DataStaleBannerProps) {
  if (!isWithinPollingWindow) {
    return (
      <div
        role="status"
        className="rounded-card border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600"
      >
        <p>
          อยู่นอกช่วงตรวจสอบราคา (ประมาณ {formatThaiPollingWindowRangeTh()}) — แสดงราคาล่าสุดจากตลาด
        </p>
      </div>
    )
  }

  const ageMs = Date.now() - lastSeenAt.getTime()
  if (ageMs < STALE_THRESHOLD_MS) return null

  const ageMin = Math.round(ageMs / 60_000)

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-card border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700"
    >
      <span aria-hidden="true" className="shrink-0">⚠</span>
      <p>
        กำลังอัปเดตราคาล่าสุด — ข้อมูลย้อนหลัง {ageMin} นาที
      </p>
    </div>
  )
}
