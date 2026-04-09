import type { Metadata } from 'next'

import {
  getHistoryStats,
  getHistoryTableRows,
  type HistoryTimeframe,
} from '@/lib/queries/history'

import { buildMetadata }             from '@/lib/utils/metadata'
import { Container }                 from '@/components/layout/Container'
import { TradingViewChart }          from '@/components/chart/TradingViewChart'
import { HistoryTimeframeNav }       from '@/components/history/HistoryTimeframeNav'
import { StatCards }                 from '@/components/history/StatCards'
import { HistoryTable }              from '@/components/history/HistoryTable'
import { MethodologyNote }           from '@/components/history/MethodologyNote'
import { Divider }                   from '@/components/ui/Divider'
import { HistoryLoadingProvider }    from '@/components/history/HistoryLoadingContext'
import { TableLoadingWrapper }       from '@/components/history/TableLoadingWrapper'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'ประวัติราคาทอง',
  description: 'ดูประวัติราคาทองคำย้อนหลัง ทองคำแท่ง 96.5% และทองรูปพรรณ พร้อมกราฟ TradingView สถิติสูง-ต่ำ และตารางราคาตั้งแต่ 7 วันจนถึงทั้งหมด',
  canonical:   '/history',
})

export const revalidate = 300

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_RANGES: HistoryTimeframe[] = ['7D', '30D', '6M', '1Y', 'All']
const DEFAULT_RANGE: HistoryTimeframe  = '7D'
const PER_PAGE = 30

function parseRange(raw: string | undefined): HistoryTimeframe {
  if (raw && (VALID_RANGES as string[]).includes(raw)) return raw as HistoryTimeframe
  return DEFAULT_RANGE
}

function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  return isNaN(n) || n < 1 ? 1 : n
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; page?: string }>
}) {
  const params = await searchParams
  const range  = parseRange(params.range)
  const page   = parsePage(params.page)

  const [stats, { rows, total, olderRowBarSell }] = await Promise.all([
    getHistoryStats(range),
    getHistoryTableRows(page, PER_PAGE, range),
  ])

  const totalPages            = Math.max(1, Math.ceil(total / PER_PAGE))
  const hasAnnouncementNumbers = rows.some(
    (r) => r.dayOrdinalDisplay != null || r.announcementNumber !== null,
  )

  return (
    <div className="py-6 sm:py-8">
      <Container>
        {/*
          HistoryLoadingProvider is a client component that shares loading state
          between HistoryTimeframeNav (sets isLoading on click) and
          TableLoadingWrapper (shows overlay while isLoading).
          Server-rendered children are passed through as React children — this
          is the standard Next.js App Router "client shell, server children" pattern.
        */}
        <HistoryLoadingProvider>
          <div className="space-y-8">

            {/* ── 1. Page heading ──────────────────────────────────────────── */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ประวัติราคาทอง</h1>
              <p className="text-sm text-gray-500 mt-1">
                ราคาทองคำแท่ง 96.5% และทองรูปพรรณ อ้างอิงจากสมาคมค้าทองคำแห่งประเทศไทย
              </p>
            </div>

            {/* ── 2. TradingView chart (Thai gold THB default) ─────────────── */}
            <TradingViewChart />

            {/* ── 3. Timeframe selector + stat cards ───────────────────────── */}
            <section aria-labelledby="stats-section-heading" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2
                  id="stats-section-heading"
                  className="text-sm font-semibold text-gray-700"
                >
                  สถิติราคาตามช่วงเวลา
                </h2>
                <HistoryTimeframeNav active={range} />
              </div>

              <TableLoadingWrapper>
                <StatCards stats={stats} range={range} />
              </TableLoadingWrapper>
            </section>

            <Divider />

            {/* ── 4. Historical table with pagination ──────────────────────── */}
            <TableLoadingWrapper>
              <HistoryTable
                rows={rows}
                page={page}
                totalPages={totalPages}
                total={total}
                range={range}
                perPage={PER_PAGE}
                hasAnnouncementNumbers={hasAnnouncementNumbers}
                olderRowBarSell={olderRowBarSell}
              />
            </TableLoadingWrapper>

            {/* ── 5. Methodology note ──────────────────────────────────────── */}
            <MethodologyNote />

          </div>
        </HistoryLoadingProvider>
      </Container>
    </div>
  )
}
