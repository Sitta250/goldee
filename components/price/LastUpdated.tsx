import { formatDateTime, formatRelativeTime } from '@/lib/utils/format'

interface LastUpdatedProps {
  timestamp: Date | string
  className?: string
}

export function LastUpdated({ timestamp, className = '' }: LastUpdatedProps) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

  return (
    <p className={`text-xs text-gray-400 ${className}`}>
      อัพเดทล่าสุด:{' '}
      <time dateTime={date.toISOString()} title={formatDateTime(date)}>
        {formatRelativeTime(date)}
      </time>
      {' '}·{' '}
      <span className="text-gray-300">{formatDateTime(date)}</span>
    </p>
  )
}
