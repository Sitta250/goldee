'use client'

// Dynamic import must live in a Client Component when ssr: false is used.
import dynamic from 'next/dynamic'
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton'

export const TradingViewChartClient = dynamic(
  () => import('./TradingViewChart').then((m) => m.TradingViewChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
)
