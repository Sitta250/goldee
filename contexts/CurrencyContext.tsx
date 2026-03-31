'use client'

/**
 * CurrencyContext
 *
 * Provides THB ↔ USD currency toggle to all client components.
 *
 * Usage:
 *   const { isUsd, toggle, format, convert } = useCurrency()
 *
 * - `format(value)`  → "฿47,500.00" (THB) or "$1,382.50" (USD)
 * - `convert(value)` → THB value ÷ rate (or same value if no rate / THB mode)
 * - `toggle()`       → switch between THB and USD
 *
 * The provider is mounted in app/layout.tsx and receives an `initialRate`
 * from the server (latest snapshot's usdThb field). This avoids a client-side
 * fetch on mount and keeps the toggle functional even without network access.
 */

import React, { createContext, useContext, useState, useCallback } from 'react'

interface CurrencyContextValue {
  isUsd:    boolean
  rate:     number | null   // USD/THB exchange rate
  symbol:   string          // '฿' or '$'
  toggle:   () => void
  /** Convert a THB amount to the active currency */
  convert:  (thbValue: number) => number
  /** Format a THB amount in the active currency with symbol */
  format:   (thbValue: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>')
  return ctx
}

interface CurrencyProviderProps {
  children:    React.ReactNode
  initialRate: number | null
}

export function CurrencyProvider({ children, initialRate }: CurrencyProviderProps) {
  const [isUsd, setIsUsd] = useState(false)

  const toggle = useCallback(() => setIsUsd((v) => !v), [])

  const convert = useCallback(
    (thbValue: number): number => {
      if (!isUsd || initialRate == null || initialRate <= 0) return thbValue
      return thbValue / initialRate
    },
    [isUsd, initialRate],
  )

  const format = useCallback(
    (thbValue: number): string => {
      const value = convert(thbValue)
      if (isUsd) {
        return new Intl.NumberFormat('en-US', {
          style:                 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)
      }
      return new Intl.NumberFormat('th-TH', {
        style:                 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    },
    [convert, isUsd],
  )

  const symbol = isUsd ? '$' : '฿'

  return (
    <CurrencyContext.Provider value={{ isUsd, rate: initialRate, symbol, toggle, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}
