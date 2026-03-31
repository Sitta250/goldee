// ─── Formatting utilities ─────────────────────────────────────────────────────
// All number/date formatting is centralised here so locale can be changed once.

// ─── Numbers ──────────────────────────────────────────────────────────────────

/** Format a gold price in THB — e.g. 47,500.00 */
export function formatPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('th-TH', {
    style:                 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/** Format a price with the ฿ symbol — e.g. ฿47,500.00 */
export function formatPriceTHB(value: number | string): string {
  return `฿${formatPrice(value)}`
}

/** Format a weight value — e.g. 2.5 บาท or 10.00 g */
export function formatWeight(value: number, unit: 'baht' | 'gram'): string {
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
  return unit === 'baht' ? `${formatted} บาท` : `${formatted} กรัม`
}

/** Format a price delta with a leading + or − sign */
export function formatDelta(value: number): string {
  const formatted = formatPrice(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `−${formatted}`
}

/** Format a percentage — e.g. +0.42% */
export function formatPercent(value: number): string {
  const abs = Math.abs(value).toFixed(2)
  return value >= 0 ? `+${abs}%` : `−${abs}%`
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/** Full Thai date — e.g. 31 มีนาคม 2568 */
export function formatDate(date: Date | string): string {
  const d = toDate(date)
  return new Intl.DateTimeFormat('th-TH', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  }).format(d)
}

/** Short Thai date — e.g. 31 มี.ค. 68 */
export function formatDateShort(date: Date | string): string {
  const d = toDate(date)
  return new Intl.DateTimeFormat('th-TH', {
    year:  '2-digit',
    month: 'short',
    day:   'numeric',
  }).format(d)
}

/** Time only — e.g. 09:35 น. */
export function formatTime(date: Date | string): string {
  const d = toDate(date)
  return (
    new Intl.DateTimeFormat('th-TH', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d) + ' น.'
  )
}

/** Date + time — e.g. 31 มี.ค. 68 เวลา 09:35 น. */
export function formatDateTime(date: Date | string): string {
  const d = toDate(date)
  return `${formatDateShort(d)} เวลา ${formatTime(d)}`
}

/** Relative time — e.g. "2 นาทีที่แล้ว" */
export function formatRelativeTime(date: Date | string): string {
  const d = toDate(date)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1)  return 'เพิ่งอัพเดท'
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`

  return formatDateShort(d)
}

// ─── Chart axis labels ────────────────────────────────────────────────────────

/** Format a timestamp for the chart X-axis based on the active timeframe */
export function formatChartLabel(
  isoString: string,
  timeframe: '1D' | '7D' | '30D' | '6M' | '1Y' | 'All',
): string {
  const d = new Date(isoString)
  if (timeframe === '1D') return formatTime(d).replace(' น.', '')
  if (timeframe === '7D') return new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(d)
  return formatDateShort(d)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input
}
