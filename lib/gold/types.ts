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
