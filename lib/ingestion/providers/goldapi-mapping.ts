export interface ChnwtResponse {
  status?: string
  response?: {
    update_date?: string
    update_time?: string
    price?: {
      gold?: { buy?: string | number; sell?: string | number }
      gold_bar?: { buy?: string | number; sell?: string | number }
    }
  }
}

export interface ChnwtMappedPayload {
  source: 'chnwt'
  asTime: string
  seq: string
  barBuy: number
  barSell: number
  ornamentBuy: number
  ornamentSell: number
  fetchedAt: string
}

// Deterministic mapping from CHNWT payload into scheduler ingest payload.
export function mapChnwtToIngestPayload(input: ChnwtResponse): ChnwtMappedPayload {
  const row = input.response
  const price = row?.price
  if (!row || !price) {
    throw new Error('CHNWT payload missing response/price')
  }

  const toNum = (value: unknown, field: string): number => {
    const n = Number(String(value ?? '').replace(/,/g, '').trim())
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`Invalid ${field}: ${JSON.stringify(value)}`)
    }
    return n
  }

  const updateDate = String(row.update_date ?? '').trim()
  const updateTime = String(row.update_time ?? '').trim()
  if (!updateDate || !updateTime) {
    throw new Error('CHNWT payload missing update_date/update_time')
  }

  const timeMatch = updateTime.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) {
    throw new Error(`Cannot parse update_time: ${updateTime}`)
  }

  const seqMatch = updateTime.match(/ครั้งที่\s*(\d+)/)
  const seq = seqMatch ? seqMatch[1] : ''

  const [dd, mm, yy] = updateDate.split('/')
  const day = Number(dd)
  const month = Number(mm)
  let year = Number(yy)
  if (year > 2500) year -= 543
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])

  const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0) - (7 * 60 * 60 * 1_000)
  const asTime = new Date(utcMs).toISOString()

  const barBuy = toNum(price.gold_bar?.buy, 'gold_bar.buy')
  const barSell = toNum(price.gold_bar?.sell, 'gold_bar.sell')
  const ornamentBuy = toNum(price.gold?.buy, 'gold.buy')
  const ornamentSell = toNum(price.gold?.sell, 'gold.sell')

  return {
    source: 'chnwt',
    asTime,
    seq: seq || asTime,
    barBuy,
    barSell,
    ornamentBuy,
    ornamentSell,
    fetchedAt: new Date().toISOString(),
  }
}
