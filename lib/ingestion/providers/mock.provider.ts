import type { GoldPriceProvider, NormalizedGoldPrice } from '../types'

/**
 * MockProvider — deterministic fake prices for local development and CI.
 *
 * Prices vary sinusoidally based on minute-of-day so consecutive cron calls
 * within the same 5-minute window return the SAME values (same bucket index →
 * same announcement number → correctly detected as duplicate by dedupe logic).
 *
 * Calls in different 5-minute windows return different prices, so the chart
 * always has something to display during development.
 */
export class MockProvider implements GoldPriceProvider {
  readonly sourceName  = 'mock'
  readonly displayName = 'Mock Data (ข้อมูลทดสอบ)'

  async fetchLatestPrice(): Promise<NormalizedGoldPrice> {
    const now = new Date()

    // 5-minute bucket index — identical within the same cron window
    const bucketIndex      = Math.floor(now.getTime() / (5 * 60_000))
    const announcementNumber = `MOCK/${String(bucketIndex).padStart(8, '0')}`

    // Price varies by minute-of-day using a sine wave (peaks midday, lower overnight)
    const minuteOfDay = now.getHours() * 60 + now.getMinutes()
    const dailyCycle  = Math.sin((minuteOfDay / 1440) * 2 * Math.PI - Math.PI / 2) * 150
    const barSell     = Math.round(47_500 + dailyCycle)

    const barBuy      = barSell - 100
    const jewelrySell = barSell + 593    // typical making-charge markup (ค่ากำเหน็จ)
    const jewelryBuy  = barSell - 800    // buy-back discount

    // Slow-moving world reference prices
    const spotGoldUsd = 2_285 + Math.round(Math.sin(now.getHours() * 0.4) * 20)
    const usdThb      = 33.45

    return {
      sourceName:          this.displayName,
      announcementNumber,
      capturedAt:          new Date(now.getTime() - 60_000), // "announced" 1 min ago
      barBuy,
      barSell,
      jewelryBuy,
      jewelrySell,
      spotGoldUsd,
      usdThb,
      notes:               null,
    }
  }
}
