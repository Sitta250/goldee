import { describe, expect, it } from 'vitest'
import { validateOutput, buildFallbackPayload } from './validate-output'
import { buildInputBundle } from './build-input-bundle'
import type { GoldAnalysisPayload, PriceFacts } from '@/types/analysis'

const basePriceFacts = (): PriceFacts => ({
  currentPrice:            45_000,
  priceTimestamp:          new Date('2026-04-10T12:00:00.000Z'),
  change_vs_yesterday_abs: 100,
  change_vs_yesterday_pct: 0.22,
  change_vs_7d_abs:        200,
  change_vs_7d_pct:        0.45,
  intraday_range_abs:      50,
  direction_today:         'up',
  direction_week:          'up',
  ma_50:                   44_000,
  ma_200:                  43_000,
  trend_direction:         'uptrend',
  bias_today:              'bullish',
  bias_week:               'bullish',
})

describe('validateOutput — no RSS news', () => {
  it('allows already_affecting drivers with medium confidence when source_count is 0', () => {
    const priceFacts = basePriceFacts()
    const bundle     = buildInputBundle(priceFacts, [], [])

    const payload: GoldAnalysisPayload = {
      ...buildFallbackPayload(priceFacts),
      market_drivers: [
        {
          theme:       { th: 'แรงซื้อตามราคา', en: 'Momentum following spot move' },
          impact_type: 'already_affecting',
          summary:     {
            th: 'ราคาปรับขึ้นตามทิศทางแนวโน้มระยะกลาง',
            en: 'Price rose in line with the medium-term trend.',
          },
          confidence:   'medium',
          source_count: 0,
        },
      ],
    }

    const { ok, errors } = validateOutput(payload, priceFacts, bundle)
    expect(errors.filter((e) => e.includes('no news'))).toEqual([])
    expect(ok).toBe(true)
  })
})
