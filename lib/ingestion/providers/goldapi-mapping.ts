export interface GoldApiResponse {
  timestamp?: number | string
  ts?: number | string
  request_id?: string
  requestId?: string
  price?: number | string
  ask?: number | string
  bid?: number | string
}

export interface GoldApiMappedPayload {
  source: 'goldapi'
  asTime: string
  seq: string
  barBuy: number
  barSell: number
  ornamentBuy: number
  ornamentSell: number
  fetchedAt: string
}

// Deterministic mapping from GoldAPI XAU/THB (troy-ounce) to local THB per baht-weight (96.5%).
export function mapGoldApiToIngestPayload(row: GoldApiResponse): GoldApiMappedPayload {
  const toNum = (value: unknown, field: string): number => {
    const n = typeof value === 'number' ? value : Number(String(value ?? '').trim())
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`Invalid ${field}: ${JSON.stringify(value)}`)
    }
    return n
  }

  const timestampValue = row.timestamp ?? row.ts
  const timestampMs =
    typeof timestampValue === 'number'
      ? (timestampValue > 1e12 ? timestampValue : timestampValue * 1_000)
      : Date.parse(String(timestampValue ?? ''))

  if (!Number.isFinite(timestampMs)) {
    throw new Error(`Missing/invalid timestamp: ${JSON.stringify(timestampValue)}`)
  }

  const TROY_OUNCE_GRAMS = 31.1034768
  const BAHT_WEIGHT_GRAMS = 15.244
  const PURITY_96_5 = 0.965
  const round10 = (n: number) => Math.round(n / 10) * 10

  const pricePerOunceThb = toNum(row.price ?? row.ask ?? row.bid, 'price')
  const perBahtWeight = (pricePerOunceThb / (TROY_OUNCE_GRAMS / BAHT_WEIGHT_GRAMS)) * PURITY_96_5

  const barSell = round10(perBahtWeight)
  const barBuy = barSell - 100
  const ornamentBuy = barBuy - 900
  const ornamentSell = barSell + 700

  return {
    source: 'goldapi',
    asTime: new Date(timestampMs).toISOString(),
    seq: String(row.timestamp ?? row.request_id ?? row.requestId ?? timestampMs),
    barBuy,
    barSell,
    ornamentBuy,
    ornamentSell,
    fetchedAt: new Date().toISOString(),
  }
}
