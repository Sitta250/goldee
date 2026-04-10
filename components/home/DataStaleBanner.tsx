/**
 * DataStaleBanner — shown when the most-recently-confirmed price snapshot
 * is older than STALE_THRESHOLD_MS.
 *
 * Uses `lastSeenAt` (last cron confirmation) rather than `fetchedAt`
 * (row creation) so a stable weekend price doesn't trigger a false alarm.
 */

// 3× the 5-min ingest interval — allows two missed runs before warning.
const STALE_THRESHOLD_MS = 15 * 60 * 1000

interface DataStaleBannerProps {
  lastSeenAt: Date
}

export function DataStaleBanner({ lastSeenAt }: DataStaleBannerProps) {
  const ageMs  = Date.now() - lastSeenAt.getTime()
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
