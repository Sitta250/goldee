/**
 * YgtaProvider — สมาคมค้าทองคำ (Gold Traders Association of Thailand)
 *
 * Data source:  https://www.goldtraders.or.th/UpdatePriceList.aspx
 * Format:       JSON array — newest entry first
 * Price unit:   THB per 1 baht-weight (บาทน้ำหนัก = 15.244 g), 96.5% purity
 * Date format:  DD/MM/YYYY (Thai Buddhist Era year, e.g. 2567 = 2024 CE)
 * Time format:  HH:mm (no seconds, local Thai time = UTC+7)
 *
 * ─── Server-side only ────────────────────────────────────────────────────────
 * This file must never be imported by client components or shipped to the browser.
 * It makes outbound network calls and reads server env vars.
 *
 * ─── Maintenance notes ───────────────────────────────────────────────────────
 * If YGTA changes their response format, update the FIELD_ALIASES map below.
 * All selectors and constants are isolated at the top of this file.
 * Parsing helpers (parseYgtaRow, parseThaiDate, parsePriceField) are exported
 * so they can be covered by unit tests without touching the network.
 */

import type { GoldPriceProvider, NormalizedGoldPrice } from '../types'

// ─── Endpoint configuration ───────────────────────────────────────────────────
// The hardcoded value is the known stable endpoint.
// Set GOLD_API_URL in .env to override (e.g. for a staging mirror or test fixture).

const YGTA_DEFAULT_URL = 'https://www.goldtraders.or.th/UpdatePriceList.aspx'

function getEndpointUrl(): string {
  return process.env.GOLD_API_URL?.trim() || YGTA_DEFAULT_URL
}

/** Request timeout — YGTA can be slow; 15s is generous but prevents hanging cron jobs */
const FETCH_TIMEOUT_MS = 15_000

/**
 * Headers sent with every request.
 * User-Agent identifies the bot; Referer satisfies YGTA's origin check.
 * Update here if the site starts returning 403 or blocking the crawler.
 */
const REQUEST_HEADERS: Record<string, string> = {
  'User-Agent':      'goldee-price-bot/1.0 (+https://goldee.app)',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
  'Referer':         'https://www.goldtraders.or.th/',
  'Cache-Control':   'no-cache',
}

// ─── Field name aliases ───────────────────────────────────────────────────────
// YGTA has historically changed capitalisation without notice.
// All known variants are listed here. The parser tries each one in order.
// If the response starts missing data, the first thing to check is whether
// YGTA added new field names — add them here, don't touch the logic below.

const FIELD_ALIASES = {
  /** Price announcement ID — "YY/NNNN" e.g. "68/0234" */
  pid:         ['Pid', 'PID', 'pid', 'PriceId', 'GoldPriceID'],

  /** Gold bar: price YGTA will pay to BUY from the public */
  barBuy:      ['BuyBar', 'buy_bar', 'buyBar', 'BarBuy', 'Bar_Buy', 'BuyBar96_5'],

  /** Gold bar: price the public pays to BUY from YGTA members */
  barSell:     ['SellBar', 'sell_bar', 'sellBar', 'BarSell', 'Bar_Sell', 'SellBar96_5'],

  /** Jewelry: buy-back price (public sells TO dealer) */
  jewelryBuy:  ['BuyOrnament', 'buy_ornament', 'OrnamentBuy', 'Ornament_Buy'],

  /** Jewelry: sale price (public BUYS from dealer, includes making charge) */
  jewelrySell: ['SellOrnament', 'sell_ornament', 'OrnamentSell', 'Ornament_Sell'],

  /** World spot price, USD per troy oz */
  spotGold:    ['SpotGold', 'spot_gold', 'GoldSpot', 'SpotGoldUSD', 'WorldGold'],

  /** Date part of announcement timestamp, "DD/MM/YYYY" */
  updateDate:  ['UpdateDate', 'update_date', 'Date', 'ThDate', 'TH_Date'],

  /** Time part of announcement timestamp, "HH:mm" */
  updateTime:  ['UpdateTime', 'update_time', 'Time', 'ThTime', 'TH_Time'],
} as const

// ─── Provider ─────────────────────────────────────────────────────────────────

export class YgtaProvider implements GoldPriceProvider {
  readonly sourceName  = 'ygta'
  readonly displayName = 'สมาคมค้าทองคำ (YGTA)'

  async fetchLatestPrice(): Promise<NormalizedGoldPrice> {
    const url = getEndpointUrl()

    // ── 1. Fetch ───────────────────────────────────────────────────────────────
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let responseText: string
    try {
      const response = await fetch(url, {
        method:  'GET',
        headers: REQUEST_HEADERS,
        cache:   'no-store', // never use Next.js fetch cache for price data
        signal:  controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      responseText = await response.text()
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw new Error(`YGTA request timed out after ${FETCH_TIMEOUT_MS / 1_000}s`)
      }
      throw new Error(`YGTA fetch failed: ${(err as Error).message}`)
    } finally {
      clearTimeout(timeoutId)
    }

    // ── 2. Parse ───────────────────────────────────────────────────────────────
    // parseYgtaResponse throws descriptive errors — they propagate to the ingestion
    // service, get logged there, and are stored in source_status.errorMessage.
    const parsed = parseYgtaResponse(responseText)

    // ── 3. Map → NormalizedGoldPrice ──────────────────────────────────────────
    return {
      sourceName:         this.displayName,
      announcementNumber: parsed.pid,
      capturedAt:         parsed.capturedAt,
      barBuy:             parsed.barBuy,
      barSell:            parsed.barSell,
      jewelryBuy:         parsed.jewelryBuy,
      jewelrySell:        parsed.jewelrySell,
      spotGoldUsd:        parsed.spotGoldUsd,
      usdThb:             null, // YGTA does not publish this field directly
      notes:              null,
    }
  }
}

// ─── Internal parsed shape ────────────────────────────────────────────────────

export interface ParsedYgtaRow {
  pid:         string | null
  capturedAt:  Date | null
  barBuy:      number
  barSell:     number
  jewelryBuy:  number
  jewelrySell: number
  spotGoldUsd: number | null
}

// ─── Parsing helpers (exported for unit tests) ────────────────────────────────

/**
 * Parse the raw response body from YGTA's endpoint.
 *
 * Expected shape: JSON array where index 0 is the most recent price update.
 * Falls back gracefully if the array has unexpected extra/missing fields.
 *
 * Throws a descriptive error if the response cannot be parsed at all,
 * or if no valid price row is found — both are logged by the ingestion service.
 */
export function parseYgtaResponse(rawBody: string): ParsedYgtaRow {
  const trimmed = rawBody.trim()
  if (!trimmed) {
    throw new Error('YGTA response is empty')
  }

  // Parse JSON — YGTA returns JSON even though Content-Type may say text/plain
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    // Log the first 200 chars of the response to help debug format changes
    const preview = trimmed.slice(0, 200).replace(/\s+/g, ' ')
    throw new Error(`YGTA response is not valid JSON. Preview: ${preview}`)
  }

  // Normalise: accept both an array (expected) and a plain object (some YGTA mirrors)
  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : [parsed]

  if (rows.length === 0) {
    throw new Error('YGTA response is an empty array — market may be closed or endpoint changed')
  }

  // YGTA returns newest first; index 0 is the current live price
  const row = rows[0]
  if (typeof row !== 'object' || row === null) {
    throw new Error(`YGTA response[0] is not an object, got: ${typeof row}`)
  }

  return parseYgtaRow(row as Record<string, unknown>)
}

/**
 * Extract and validate a single YGTA price record.
 * Tries every known field-name alias for each logical field.
 * Throws if any required price field is missing or invalid.
 */
export function parseYgtaRow(row: Record<string, unknown>): ParsedYgtaRow {
  const barBuy     = requirePriceField(row, 'barBuy',      FIELD_ALIASES.barBuy)
  const barSell    = requirePriceField(row, 'barSell',     FIELD_ALIASES.barSell)
  const jewelryBuy = requirePriceField(row, 'jewelryBuy',  FIELD_ALIASES.jewelryBuy)
  const jewelrySell= requirePriceField(row, 'jewelrySell', FIELD_ALIASES.jewelrySell)

  // Optional fields — null if missing or unparseable
  const spotGoldUsd = optionalPriceField(row, FIELD_ALIASES.spotGold)
  const pid         = optionalStringField(row, FIELD_ALIASES.pid)

  // Timestamp — combine UpdateDate + UpdateTime
  const dateStr  = optionalStringField(row, FIELD_ALIASES.updateDate)
  const timeStr  = optionalStringField(row, FIELD_ALIASES.updateTime)
  const capturedAt = parseThaiDateTime(dateStr, timeStr)

  return { pid, capturedAt, barBuy, barSell, jewelryBuy, jewelrySell, spotGoldUsd }
}

/**
 * Parse a price field that MUST be present and valid.
 * Tries all provided aliases in order.
 * Throws a clear error naming the logical field if none resolve to a valid number.
 */
export function requirePriceField(
  row:         Record<string, unknown>,
  logicalName: string,
  aliases:     readonly string[],
): number {
  const raw = pickField(row, aliases)
  const num = parsePriceValue(raw)

  if (num === null) {
    const tried = aliases.join(' / ')
    throw new Error(
      `YGTA parse error: required field "${logicalName}" not found or not numeric. ` +
      `Tried aliases: [${tried}]. ` +
      `Got: ${JSON.stringify(raw)}. ` +
      `This likely means YGTA changed their response format — update FIELD_ALIASES.`,
    )
  }

  return num
}

/**
 * Parse an optional price field.
 * Returns null if missing or if the value isn't a valid positive number.
 */
export function optionalPriceField(
  row:     Record<string, unknown>,
  aliases: readonly string[],
): number | null {
  return parsePriceValue(pickField(row, aliases))
}

/**
 * Extract an optional string field.
 * Returns null if missing or empty.
 */
export function optionalStringField(
  row:     Record<string, unknown>,
  aliases: readonly string[],
): string | null {
  const val = pickField(row, aliases)
  if (val == null) return null
  const s = String(val).trim()
  return s.length > 0 ? s : null
}

/**
 * Convert a raw value to a price number.
 * Handles: number, numeric string, string with Thai commas (47,500.00).
 * Returns null if the value is missing, empty, zero, or not parseable as a
 * positive finite number.
 */
export function parsePriceValue(raw: unknown): number | null {
  if (raw == null) return null

  let num: number
  if (typeof raw === 'number') {
    num = raw
  } else if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/,/g, '')  // strip Thai thousands commas
    if (!cleaned) return null
    num = parseFloat(cleaned)
  } else {
    return null
  }

  if (!isFinite(num) || num <= 0) return null
  return num
}

/**
 * Parse YGTA's split date + time fields into a Date.
 *
 * Date format:  DD/MM/YYYY  (year may be Thai Buddhist Era: add 543 to get CE)
 * Time format:  HH:mm or "HH:mm น." (Thai noon suffix)
 * Timezone:     UTC+7 (Thai standard time — YGTA times are local)
 *
 * Returns null if either string is missing or unrecognisable.
 */
export function parseThaiDateTime(
  dateStr: string | null,
  timeStr: string | null,
): Date | null {
  if (!dateStr) return null

  // Split "DD/MM/YYYY" — accept "/" or "-" as separators
  const dateParts = dateStr.split(/[\/\-]/)
  if (dateParts.length !== 3) return null

  const day   = parseInt(dateParts[0], 10)
  const month = parseInt(dateParts[1], 10) // 1-based
  let   year  = parseInt(dateParts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  if (day < 1 || day > 31 || month < 1 || month > 12) return null

  // Thai Buddhist Era correction: years > 2500 are BE (e.g. 2567 BE = 2024 CE)
  if (year > 2500) year -= 543

  // Sanity check on year after conversion
  if (year < 2020 || year > 2100) return null

  // Parse time — default to 00:00 if absent
  let hours   = 0
  let minutes = 0
  if (timeStr) {
    // Strip Thai suffix "น." and whitespace
    const cleanTime = timeStr.replace(/น\.?$/, '').trim()
    const timeParts = cleanTime.split(':')
    if (timeParts.length >= 2) {
      hours   = parseInt(timeParts[0], 10)
      minutes = parseInt(timeParts[1], 10)
      if (isNaN(hours) || isNaN(minutes)) { hours = 0; minutes = 0 }
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) { hours = 0; minutes = 0 }
    }
  }

  // Construct timestamp in UTC+7 (Thailand Standard Time = UTC+7, no DST)
  const UTC_OFFSET_MS = 7 * 60 * 60 * 1_000
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - UTC_OFFSET_MS
  const result = new Date(utcMs)

  return isNaN(result.getTime()) ? null : result
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Find the first alias that exists as an own-property key in the row object.
 * Returns undefined if none match — caller decides whether that's an error.
 */
function pickField(row: Record<string, unknown>, aliases: readonly string[]): unknown {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias]
    }
  }
  return undefined
}
