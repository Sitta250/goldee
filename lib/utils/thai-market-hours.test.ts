/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getBangkokHourMinute,
  isThaiGoldPollingWindow,
  parseThaiHhMm,
} from './thai-market-hours'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseThaiHhMm', () => {
  it('parses valid HH:MM', () => {
    expect(parseThaiHhMm('18:30', '09:00')).toEqual({ hour: 18, minute: 30 })
  })

  it('uses fallback when raw missing', () => {
    expect(parseThaiHhMm(undefined, '09:00')).toEqual({ hour: 9, minute: 0 })
  })
})

describe('getBangkokHourMinute', () => {
  it('maps UTC instant to Bangkok wall clock', () => {
    // 2026-06-15 01:59 UTC = 08:59 ICT
    const d = new Date('2026-06-15T01:59:00.000Z')
    expect(getBangkokHourMinute(d)).toEqual({ hour: 8, minute: 59 })
  })

  it('09:00 ICT = 02:00 UTC same calendar day', () => {
    const d = new Date('2026-06-15T02:00:00.000Z')
    expect(getBangkokHourMinute(d)).toEqual({ hour: 9, minute: 0 })
  })

  it('18:30 ICT = 11:30 UTC', () => {
    const d = new Date('2026-06-15T11:30:00.000Z')
    expect(getBangkokHourMinute(d)).toEqual({ hour: 18, minute: 30 })
  })
})

describe('isThaiGoldPollingWindow', () => {
  it('false at 08:59 Bangkok (default window 09:00–18:30)', () => {
    vi.stubEnv('THAI_FETCH_START_HHMM', '09:00')
    vi.stubEnv('THAI_FETCH_END_HHMM', '18:30')
    const d = new Date('2026-06-15T01:59:00.000Z')
    expect(isThaiGoldPollingWindow(d)).toBe(false)
  })

  it('true at 09:00 Bangkok', () => {
    vi.stubEnv('THAI_FETCH_START_HHMM', '09:00')
    vi.stubEnv('THAI_FETCH_END_HHMM', '18:30')
    const d = new Date('2026-06-15T02:00:00.000Z')
    expect(isThaiGoldPollingWindow(d)).toBe(true)
  })

  it('true at 18:30 Bangkok inclusive end', () => {
    vi.stubEnv('THAI_FETCH_START_HHMM', '09:00')
    vi.stubEnv('THAI_FETCH_END_HHMM', '18:30')
    const d = new Date('2026-06-15T11:30:00.000Z')
    expect(isThaiGoldPollingWindow(d)).toBe(true)
  })

  it('false at 18:31 Bangkok', () => {
    vi.stubEnv('THAI_FETCH_START_HHMM', '09:00')
    vi.stubEnv('THAI_FETCH_END_HHMM', '18:30')
    const d = new Date('2026-06-15T11:31:00.000Z')
    expect(isThaiGoldPollingWindow(d)).toBe(false)
  })
})
