/**
 * Development-only parity check helper for /history.
 *
 * Compares the latest stored row shape against what we expect from a
 * YGTA-quality source row, and logs any discrepancies.
 *
 * Usage:
 *   HISTORY_DEBUG=1 node -e "require('./lib/history/parity-check').runParityCheck()"
 *
 * Or call from a test/script — never call from production render paths.
 */

const IS_DEV = process.env.NODE_ENV !== 'production'

export interface ParityRow {
  id:                 string
  source:             string
  capturedAt:         Date | null
  fetchedAt:          Date
  announcementNumber: string | null
  goldBarBuy:         number
  goldBarSell:        number
  jewelryBuy:         number
  jewelrySell:        number
}

export interface ParityCheckResult {
  ok:       boolean
  warnings: string[]
  row:      ParityRow | null
}

/**
 * Validates a single row against YGTA table-quality expectations.
 * Returns a result object with an `ok` flag and any warning messages.
 */
export function checkRowParity(row: ParityRow): ParityCheckResult {
  const warnings: string[] = []

  // Must have all four price fields as positive numbers
  const priceFields: Array<[keyof ParityRow, number]> = [
    ['goldBarBuy',  row.goldBarBuy],
    ['goldBarSell', row.goldBarSell],
    ['jewelryBuy',  row.jewelryBuy],
    ['jewelrySell', row.jewelrySell],
  ]
  for (const [field, value] of priceFields) {
    if (!value || value <= 0) {
      warnings.push(`${String(field)} is missing or zero`)
    }
  }

  // Bar sell should be > bar buy (normal spread)
  if (row.goldBarSell > 0 && row.goldBarBuy > 0 && row.goldBarSell < row.goldBarBuy) {
    warnings.push('goldBarSell < goldBarBuy — spread is inverted')
  }

  // Jewelry sell should be > bar sell (making charge)
  if (row.jewelrySell > 0 && row.goldBarSell > 0 && row.jewelrySell < row.goldBarSell) {
    warnings.push('jewelrySell < goldBarSell — jewelry premium is missing')
  }

  // YGTA rows should have capturedAt
  if (row.capturedAt === null) {
    warnings.push('capturedAt is null — timestamp falls back to fetchedAt (may not align with YGTA list)')
  }

  // YGTA rows should have announcementNumber
  if (row.announcementNumber === null) {
    warnings.push('announcementNumber is null — cannot cross-reference with YGTA update list')
  }

  return {
    ok: warnings.length === 0,
    warnings,
    row,
  }
}

/**
 * Logs a parity check result. No-op in production.
 */
export function logParityResult(result: ParityCheckResult): void {
  if (!IS_DEV) return

  const prefix = result.ok ? '[parity ✓]' : '[parity ✗]'
  console.log(
    JSON.stringify({
      ts:       new Date().toISOString(),
      ns:       'history/parity',
      ok:       result.ok,
      warnings: result.warnings,
      rowId:    result.row?.id ?? null,
      source:   result.row?.source ?? null,
      canonicalAt: result.row
        ? (result.row.capturedAt ?? result.row.fetchedAt).toISOString()
        : null,
      announcementNumber: result.row?.announcementNumber ?? null,
      goldBarSell:        result.row?.goldBarSell ?? null,
    }),
  )

  if (!result.ok) {
    console.warn(`${prefix} parity warnings:`, result.warnings)
  }
}
