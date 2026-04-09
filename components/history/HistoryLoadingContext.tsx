'use client'

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface HistoryLoadingCtx {
  isLoading: boolean
  setLoading: (v: boolean) => void
}

const Context = createContext<HistoryLoadingCtx>({
  isLoading: false,
  setLoading: () => {},
})

export function HistoryLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false)
  return (
    <Context.Provider value={{ isLoading, setLoading }}>
      {children}
    </Context.Provider>
  )
}

export function useHistoryLoading() {
  return useContext(Context)
}
