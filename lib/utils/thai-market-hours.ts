/**
 * Thai gold polling window (Asia/Bangkok).
 *
 * YGTA-style domestic rounds are roughly morning (~09:00) through evening (~18:00).
 * We poll only inside [start, end] inclusive, configurable via env.
 */

const DEFAULT_START = '09:00'
const DEFAULT_END   = '18:30'

/** Parse "HH:MM" 24h → hour and minute. Invalid values use safe defaults. */
export function parseThaiHhMm(
  raw: string | undefined,
  fallback: string,
): { hour: number; minute: number } {
  const tryParse = (str: string): { hour: number; minute: number } | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(str.trim())
    if (!m) return null
    const hour   = parseInt(m[1], 10)
    const minute = parseInt(m[2], 10)
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return { hour, minute }
  }

  const primary = tryParse(raw?.trim() || fallback)
  if (primary) return primary
  const fb = tryParse(fallback)
  if (fb) return fb
  const d = tryParse(DEFAULT_START)
  return d ?? { hour: 9, minute: 0 }
}

function getConfiguredWindow(): {
  startMin: number
  endMin: number
  startLabel: string
  endLabel: string
} {
  const sh = parseThaiHhMm(process.env.THAI_FETCH_START_HHMM, DEFAULT_START)
  const eh = parseThaiHhMm(process.env.THAI_FETCH_END_HHMM, DEFAULT_END)
  const startMin = sh.hour * 60 + sh.minute
  const endMin   = eh.hour * 60 + eh.minute
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    startMin,
    endMin,
    startLabel: `${pad(sh.hour)}:${pad(sh.minute)}`,
    endLabel:   `${pad(eh.hour)}:${pad(eh.minute)}`,
  }
}

/** Local hour and minute in Asia/Bangkok for the given instant. */
export function getBangkokHourMinute(date: Date): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  })
  let hour = 0
  let minute = 0
  for (const p of fmt.formatToParts(date)) {
    if (p.type === 'hour') hour = parseInt(p.value, 10)
    if (p.type === 'minute') minute = parseInt(p.value, 10)
  }
  return { hour, minute }
}

/**
 * True when `at` falls inside the configured polling window in Bangkok time,
 * inclusive of both start and end clock times.
 */
export function isThaiGoldPollingWindow(at: Date = new Date()): boolean {
  const { startMin, endMin } = getConfiguredWindow()
  const { hour, minute }     = getBangkokHourMinute(at)
  const nowMin               = hour * 60 + minute
  return nowMin >= startMin && nowMin <= endMin
}

/** Thai copy describing the polling window (for footers / banners). */
export function formatThaiPollingWindowRangeTh(): string {
  const { startLabel, endLabel } = getConfiguredWindow()
  return `${startLabel}–${endLabel} น.`
}

/**
 * When true, scheduled ingestion should not be blocked by the Thai window.
 * - SKIP_FETCH_WINDOW=1 — staging / emergency
 * - NODE_ENV=development — local dev
 * - GOLD_PROVIDER=mock — deterministic local provider
 */
export function shouldBypassThaiFetchWindow(): boolean {
  if (process.env.SKIP_FETCH_WINDOW === '1') return true
  if (process.env.NODE_ENV === 'development') return true
  const p = (process.env.GOLD_PROVIDER ?? 'mock').toLowerCase()
  if (p === 'mock') return true
  return false
}
