import { db } from '@/lib/db'
import type { SiteSettings, SourceStatus, SourceStatusValue } from '@/types/settings'

// ─── Site Settings ────────────────────────────────────────────────────────────

/** Returns the single SiteSettings row. Throws if none exists. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await db.siteSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  if (!row) throw new Error('SiteSettings row not found — run `npm run db:seed`')
  return row
}

/** Returns SiteSettings or null (safe for non-critical use). */
export async function getSiteSettingsOrNull(): Promise<SiteSettings | null> {
  return db.siteSettings.findFirst({ orderBy: { createdAt: 'asc' } })
}

// ─── Source Status ────────────────────────────────────────────────────────────

function toSourceStatus(row: {
  id: string
  sourceName: string
  displayName: string
  status: string
  lastCheckedAt: Date
  lastSuccessAt: Date | null
  lastSuccessPrice: object | null
  errorMessage: string | null
  consecutiveFailures: number
  createdAt: Date
  updatedAt: Date
}): SourceStatus {
  return {
    id:                  row.id,
    sourceName:          row.sourceName,
    displayName:         row.displayName,
    status:              row.status as SourceStatusValue,
    lastCheckedAt:       row.lastCheckedAt,
    lastSuccessAt:       row.lastSuccessAt,
    lastSuccessPrice:    row.lastSuccessPrice != null ? Number(row.lastSuccessPrice) : null,
    errorMessage:        row.errorMessage,
    consecutiveFailures: row.consecutiveFailures,
    createdAt:           row.createdAt,
    updatedAt:           row.updatedAt,
  }
}

/** Status of a specific source by name */
export async function getSourceStatus(sourceName: string): Promise<SourceStatus | null> {
  const row = await db.sourceStatus.findUnique({ where: { sourceName } })
  return row ? toSourceStatus(row) : null
}

/** All source statuses — for a status/monitoring page */
export async function getAllSourceStatuses(): Promise<SourceStatus[]> {
  const rows = await db.sourceStatus.findMany({ orderBy: { sourceName: 'asc' } })
  return rows.map(toSourceStatus)
}

/**
 * Upsert source status after a cron run.
 * Call with status='ok' on success, 'error' on failure.
 */
export async function upsertSourceStatus(
  sourceName:   string,
  displayName:  string,
  status:       SourceStatusValue,
  opts: {
    lastSuccessPrice?: number
    errorMessage?:     string
  } = {},
): Promise<void> {
  const now = new Date()

  const isOk = status === 'ok'

  await db.sourceStatus.upsert({
    where: { sourceName },
    create: {
      sourceName,
      displayName,
      status,
      lastCheckedAt:       now,
      lastSuccessAt:       isOk ? now : null,
      lastSuccessPrice:    isOk ? opts.lastSuccessPrice ?? null : null,
      errorMessage:        isOk ? null : opts.errorMessage ?? null,
      consecutiveFailures: isOk ? 0 : 1,
    },
    update: {
      status,
      lastCheckedAt:       now,
      lastSuccessAt:       isOk ? now : undefined,
      lastSuccessPrice:    isOk ? opts.lastSuccessPrice ?? undefined : undefined,
      errorMessage:        isOk ? null : opts.errorMessage ?? null,
      consecutiveFailures: isOk
        ? 0
        : { increment: 1 },
    },
  })
}
