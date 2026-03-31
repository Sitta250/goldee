// ─── Gold price fetcher ───────────────────────────────────────────────────────
// This is the ONLY file that talks to the external data source.
// Swap sources by updating the fetch logic below — nothing else changes.

export interface RawGoldPrice {
  // Required prices (all THB per 1 baht-weight)
  goldBarBuy:  number
  goldBarSell: number
  jewelryBuy:  number
  jewelrySell: number

  // Source identification
  source:             string       // short code: "ygta" | "manual" | "mock"
  sourceName?:        string       // display name: "สมาคมค้าทองคำ"
  announcementNumber?:string       // e.g. "68/0234"
  capturedAt?:        Date         // when officially announced (if known from source)

  // Optional world reference prices
  spotGoldUsd?: number             // USD per troy oz
  usdThb?:      number             // USD → THB exchange rate

  // Raw payload for debugging / source-swap safety
  rawPayload: Record<string, unknown>
}

export async function fetchGoldPrice(): Promise<RawGoldPrice> {
  // TODO: Replace this mock with a real API call when the data source is confirmed.
  //
  // Example shape for a real YGTA-style implementation:
  //
  //   const res = await fetch(process.env.GOLD_API_URL!, {
  //     headers: { 'X-Api-Key': process.env.GOLD_API_KEY ?? '' },
  //     next: { revalidate: 0 },   // always fresh — never cache at Next.js layer
  //   })
  //   if (!res.ok) throw new Error(`Gold API responded ${res.status}: ${res.statusText}`)
  //   const json = await res.json()
  //   return transformYgta(json)   // see lib/gold/transformer.ts

  // ── Mock data — remove when real source is wired up ──────────────────────
  const now  = new Date()
  const mock = {
    announcement_no: `68/${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    buy_bar:         47_400,
    sell_bar:        47_500,
    buy_ornament:    46_700,
    sell_ornament:   48_093,
    spot_usd:        2_296.5,
    usd_thb:         33.48,
    announced_at:    new Date(now.getTime() - 60_000).toISOString(), // 1 min ago
  }

  return {
    source:             'mock',
    sourceName:         'Mock Data (ข้อมูลทดสอบ)',
    announcementNumber: mock.announcement_no,
    capturedAt:         new Date(mock.announced_at),
    goldBarBuy:         mock.buy_bar,
    goldBarSell:        mock.sell_bar,
    jewelryBuy:         mock.buy_ornament,
    jewelrySell:        mock.sell_ornament,
    spotGoldUsd:        mock.spot_usd,
    usdThb:             mock.usd_thb,
    rawPayload:         mock as unknown as Record<string, unknown>,
  }
}
