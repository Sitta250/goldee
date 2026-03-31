import type { GoldPriceProvider, NormalizedGoldPrice } from '../types'

/**
 * YgtaProvider — placeholder for สมาคมค้าทองคำ (Gold Traders Association of Thailand)
 *
 * ─── DO NOT implement fragile HTML scraping here yet ─────────────────────────
 * This file is intentionally incomplete.
 * Implement only after confirming a stable data source (JSON API preferred).
 *
 * ─── YGTA data facts ─────────────────────────────────────────────────────────
 * - Website:       https://www.goldtraders.or.th/
 * - Price unit:    THB per 1 baht-weight (บาทน้ำหนัก = 15.244g), 96.5% purity
 * - Announcement:  "YY/NNNN" format, e.g. "68/0234"
 * - Update freq:   ~2× per trading day (09:00 and afternoon)
 * - Jewelry sell:  bar sell + making charge (ค่ากำเหน็จ, typically ~600 THB)
 *
 * ─── Implementation steps when ready ─────────────────────────────────────────
 *
 * Option A — JSON API (preferred):
 *   1. Set GOLD_API_URL in .env to the confirmed endpoint
 *   2. Uncomment the fetch block in fetchLatestPrice()
 *   3. Implement parseYgtaJson() with the actual response shape
 *   4. Return NormalizedGoldPrice
 *
 * Option B — HTML scraping (last resort):
 *   1. Use a proper HTML parser (e.g. cheerio), NOT regex on raw HTML
 *   2. Implement parseYgtaHtml() — keep selectors in one place for easy updates
 *   3. Add an integration test so a layout change is caught immediately
 *   4. Never store the raw HTML in the snapshot table
 *
 * ─── To activate this provider ───────────────────────────────────────────────
 * In .env:
 *   GOLD_PROVIDER=ygta
 *   GOLD_API_URL=https://...         ← confirmed endpoint
 *   GOLD_API_KEY=...                 ← if required by the source
 */
export class YgtaProvider implements GoldPriceProvider {
  readonly sourceName  = 'ygta'
  readonly displayName = 'สมาคมค้าทองคำ (YGTA)'

  async fetchLatestPrice(): Promise<NormalizedGoldPrice> {
    // ── Step 1: Fetch ──────────────────────────────────────────────────────────
    // TODO: Confirm endpoint URL and uncomment

    // const url = process.env.GOLD_API_URL
    // if (!url) throw new Error('GOLD_API_URL is not set in environment variables')
    //
    // const response = await fetch(url, {
    //   headers: {
    //     'User-Agent': 'goldee-price-bot/1.0',
    //     ...(process.env.GOLD_API_KEY
    //       ? { Authorization: `Bearer ${process.env.GOLD_API_KEY}` }
    //       : {}),
    //   },
    //   cache: 'no-store',  // always fresh — never use Next.js fetch cache here
    // })
    //
    // if (!response.ok) {
    //   throw new Error(`YGTA request failed: HTTP ${response.status} ${response.statusText}`)
    // }

    // ── Step 2: Parse ──────────────────────────────────────────────────────────
    // TODO: Choose based on source format

    // JSON API:
    //   const json = await response.json()
    //   const parsed = parseYgtaJson(json)

    // HTML scrape (avoid if possible):
    //   const html = await response.text()
    //   const parsed = parseYgtaHtml(html)

    // ── Step 3: Return normalised price ────────────────────────────────────────
    // TODO: Map parsed fields → NormalizedGoldPrice

    // return {
    //   sourceName:          this.displayName,
    //   announcementNumber:  parsed.announcementNo,    // e.g. "68/0234"
    //   capturedAt:          new Date(parsed.updatedAt),
    //   barBuy:              parsed.buyBar,
    //   barSell:             parsed.sellBar,
    //   jewelryBuy:          parsed.buyOrnament,
    //   jewelrySell:         parsed.sellOrnament,
    //   spotGoldUsd:         parsed.spotGoldUsd ?? null,
    //   usdThb:              parsed.usdThb ?? null,
    //   notes:               null,
    // }

    throw new Error(
      'YgtaProvider is not implemented yet. ' +
      'Set GOLD_PROVIDER=mock in your .env file to use mock data during development.',
    )
  }
}

// ─── Parsing helpers — implement when source format is confirmed ──────────────

// interface ParsedYgtaPrice {
//   announcementNo:  string
//   updatedAt:       string     // parseable date string from the source
//   buyBar:          number
//   sellBar:         number
//   buyOrnament:     number
//   sellOrnament:    number
//   spotGoldUsd?:    number
//   usdThb?:         number
// }

// function parseYgtaJson(raw: unknown): ParsedYgtaPrice {
//   // TODO: Validate that expected keys exist before accessing them.
//   // Be defensive — the source can change format without warning.
//   throw new Error('parseYgtaJson: not implemented')
// }

// function parseYgtaHtml(html: string): ParsedYgtaPrice {
//   // TODO: Use cheerio or similar — never use regex on HTML.
//   // const $ = load(html)
//   // const sellBar = parseFloat($('#sell-bar-price').text().replace(/,/g, ''))
//   // ...
//   throw new Error('parseYgtaHtml: not implemented')
// }
