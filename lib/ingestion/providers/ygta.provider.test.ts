/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { parseYgtaRow } from './ygta.provider'

describe('parseYgtaRow', () => {
  it('prefers seq over goldPriceID for pid (announcement ordinal)', () => {
    const row = parseYgtaRow({
      bL_BuyPrice:     71_700,
      bL_SellPrice:    71_900,
      oM965_BuyPrice:  70_266.6,
      oM965_SellPrice: 72_700,
      asTime:          '2026-04-08T12:24:00',
      goldPriceID:     84_819,
      seq:             50,
    })
    expect(row.pid).toBe('50')
  })

  it('falls back to goldPriceID when seq is absent', () => {
    const row = parseYgtaRow({
      bL_BuyPrice:     71_700,
      bL_SellPrice:    71_900,
      oM965_BuyPrice:  70_266.6,
      oM965_SellPrice: 72_700,
      asTime:          '2026-04-08T12:24:00',
      goldPriceID:     12_345,
    })
    expect(row.pid).toBe('12345')
  })
})
