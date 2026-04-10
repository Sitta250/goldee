import { formatDateTime, formatRelativeTime, formatTime } from '@/lib/utils/format'

interface LastUpdatedProps {
  /** When Goldee's system stored this snapshot (fetchedAt from DB) */
  fetchedAt: Date | string
  /**
   * When the upstream source (e.g. YGTA) officially announced this price.
   * Shown as "เวลาประกาศ" when present so users know the price age, not just
   * the app-ingestion age.
   */
  capturedAt?: Date | string | null
  /** Source display name used in the tooltip, e.g. "สมาคมค้าทองคำ" */
  sourceName?: string | null
  className?: string
}

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d
}

export function LastUpdated({
  fetchedAt,
  capturedAt,
  sourceName,
  className = '',
}: LastUpdatedProps) {
  const fetched  = toDate(fetchedAt)
  const captured = capturedAt ? toDate(capturedAt) : null

  return (
    <p className={`text-xs text-gray-400 ${className}`}>
      {captured ? (
        <>
          {/* Source name — visible inline */}
          {sourceName && (
            <>
              <span className="text-gray-300">{sourceName}</span>
              {' '}·{' '}
            </>
          )}
          {/* Source announcement time — the most meaningful "price as-of" */}
          <span title={`เวลาประกาศ: ${formatDateTime(captured)}`}>
            เวลาประกาศ{' '}
            <time dateTime={captured.toISOString()} className="font-medium text-gray-500">
              {formatTime(captured)}
            </time>
          </span>
          {' '}·{' '}
          {/* App ingestion time — shows how fresh the cached data is */}
          <span>
            รับข้อมูล{' '}
            <time dateTime={fetched.toISOString()} title={formatDateTime(fetched)}>
              {formatRelativeTime(fetched)}
            </time>
          </span>
        </>
      ) : (
        <>
          {/* No capturedAt: show fetchedAt as both relative and absolute */}
          รับข้อมูล{' '}
          <time dateTime={fetched.toISOString()} title={formatDateTime(fetched)}>
            {formatRelativeTime(fetched)}
          </time>
          {' '}·{' '}
          <span className="text-gray-300">{formatDateTime(fetched)}</span>
        </>
      )}
    </p>
  )
}
