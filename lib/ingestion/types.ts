// ─── Core types for the ingestion layer ──────────────────────────────────────
// These types live between the provider (data source) and the persistence layer.
// Nothing outside lib/ingestion/ should depend on these directly —
// the rest of the app uses the DB-level types in types/gold.ts.

/**
 * The normalised gold price shape every provider must return.
 * Field names match the product spec, not DB column names.
 * All prices are THB per 1 baht-weight (15.244g), 96.5% purity reference.
 */
export interface NormalizedGoldPrice {
  sourceName:          string        // Human-readable: "สมาคมค้าทองคำ (YGTA)"
  announcementNumber:  string | null // Official ID, e.g. "68/0234"
  capturedAt:          Date | null   // When officially announced (from source timestamp)

  barBuy:              number        // Gold bar: price to buy FROM customer
  barSell:             number        // Gold bar: price to sell TO customer
  jewelryBuy:          number        // Jewelry: price to buy FROM customer
  jewelrySell:         number        // Jewelry: price to sell TO customer

  spotGoldUsd:         number | null // World spot price, USD per troy oz (optional)
  usdThb:              number | null // USD → THB exchange rate at fetch time (optional)

  notes:               string | null // Admin annotation — not for debug dumps
}

/**
 * Contract every gold price provider must satisfy.
 * To add a new source: implement this interface and register in providers/index.ts.
 */
export interface GoldPriceProvider {
  /** Short code stored in the DB `source` column. E.g. "ygta" | "mock" */
  readonly sourceName:  string
  /** Human-readable name for logs and the source_status table */
  readonly displayName: string
  /** Fetch and return the latest normalised price. Must throw on failure. */
  fetchLatestPrice(): Promise<NormalizedGoldPrice>
}

/**
 * Result returned by ingestGoldPrice() after one cycle.
 * The calling route (cron or trigger) returns this directly as JSON.
 */
export type IngestionResult =
  | { status: 'inserted'; snapshotId: string; barSell: number; isDuplicate: false }
  | { status: 'skipped';  reason: string;                      isDuplicate: true  }
  | { status: 'error';    error: string;                       isDuplicate: false }
