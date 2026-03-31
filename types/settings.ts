// ─── Site settings ────────────────────────────────────────────────────────────
// Single-row table — only one SiteSettings row should exist.

export interface SiteSettings {
  id:                 string
  siteName:           string
  siteDescription:    string
  defaultCurrency:    string
  contactEmail:       string | null
  adBannerText:       string | null
  adRectangleText:    string | null
  adSidebarText:      string | null
  adFooterText:       string | null
  maintenanceMode:    boolean
  maintenanceMessage: string | null
  createdAt:          Date
  updatedAt:          Date
}

// ─── Source status ────────────────────────────────────────────────────────────
// One row per gold price source. Updated on every cron run.

export type SourceStatusValue = 'ok' | 'error' | 'stale'

export interface SourceStatus {
  id:                  string
  sourceName:          string
  displayName:         string
  status:              SourceStatusValue
  lastCheckedAt:       Date
  lastSuccessAt:       Date | null
  lastSuccessPrice:    number | null
  errorMessage:        string | null
  consecutiveFailures: number
  createdAt:           Date
  updatedAt:           Date
}
