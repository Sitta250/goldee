'use client'

import type { ReactNode } from 'react'
import { useHistoryLoading } from './HistoryLoadingContext'

export function TableLoadingWrapper({ children }: { children: ReactNode }) {
  const { isLoading } = useHistoryLoading()

  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          aria-live="polite"
          aria-label="กำลังโหลดข้อมูล"
          className="absolute inset-0 flex items-center justify-center rounded-card bg-white/70 backdrop-blur-[1px]"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gold-500 animate-spin"
              aria-hidden="true"
            />
            กำลังโหลด…
          </div>
        </div>
      )}
    </div>
  )
}
