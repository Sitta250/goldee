/**
 * History page source strategy.
 *
 * Defines the canonical data source for the /history page and provides
 * helpers to resolve per-row canonical timestamps.
 *
 * Scoped to history queries only — does not affect the ingestion pipeline
 * or any other query layer.
 */

// ─── Source identifiers ───────────────────────────────────────────────────────

/**
 * Preferred source: upstream feed or YGTA, whichever provides table-quality rows.
 * A row is "table-quality" when it has all four price fields populated and
 * at minimum a fetchedAt timestamp.
 */
export const PRIMARY_HISTORY_SOURCE = 'upstream_or_ygta' as const

/**
 * Fallback source: YGTA-backed rows only.
 * Applied when upstream rows lack strict-match fields required for YGTA parity.
 */
export const FALLBACK_HISTORY_SOURCE = 'ygta' as const

export type HistorySource =
  | typeof PRIMARY_HISTORY_SOURCE
  | typeof FALLBACK_HISTORY_SOURCE

// ─── Canonical timestamp resolution ──────────────────────────────────────────

/**
 * Returns the canonical timestamp for a snapshot row.
 *
 * Priority order (matches YGTA update list alignment):
 *   1. capturedAt — source-native announcement time from goldtraders.or.th
 *   2. fetchedAt  — system ingest time (fallback when source timestamp is absent)
 *
 * All sorting, filtering, and display on /history MUST use this function
 * so there is exactly one decision point about which timestamp wins.
 */
export function canonicalTimestamp(row: {
  capturedAt: Date | null
  fetchedAt:  Date
}): Date {
  return row.capturedAt ?? row.fetchedAt
}

/**
 * Returns which timestamp field was used for a given row.
 * Useful for diagnostics and methodology disclosures.
 */
export function timestampSourceLabel(row: {
  capturedAt: Date | null
}): 'capturedAt' | 'fetchedAt' {
  return row.capturedAt !== null ? 'capturedAt' : 'fetchedAt'
}
