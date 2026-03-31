import type { Metadata } from 'next'

import {
  getHistoryChartData,
  getHistoryStats,
  getHistoryTableRows,
  type HistoryTimeframe,
} from '@/lib/queries/history'

import { buildMetadata }        from '@/lib/utils/metadata'
import { Container }            from '@/components/layout/Container'
import { HistoryChart }         from '@/components/history/HistoryChart'
import { HistoryTimeframeNav }  from '@/components/history/HistoryTimeframeNav'
import { StatCards }            from '@/components/history/StatCards'
import { HistoryTable }         from '@/components/history/HistoryTable'
import { MethodologyNote }      from '@/components/history/MethodologyNote'
import { AdRectangle }          from '@/components/ads/AdRectangle'
import { Divider }              from '@/components/ui/Divider'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'ประวัติราคาทอง',
  description: 'ดูประวัติราคาทองคำย้อนหลัง ทองคำแท่ง 96.5% และทองรูปพรรณ พร้อมกราฟแนวโน้ม สถิติสูง-ต่ำ และตารางราคาตั้งแต่ 7 วันจนถึงทั้งหมด',
  canonical:   '/history',
})

// Revalidate matches the cron interval
export const revalidate = 300

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_RANGES: HistoryTimeframe[] = ['7D', '30D', '6M', '1Y', 'All']
const DEFAULT_RANGE: HistoryTimeframe  = '7D'
const PER_PAGE = 30

function parseRange(raw: string | undefined): HistoryTimeframe {
  if (raw && (VALID_RANGES as string[]).includes(raw)) {
    return raw as HistoryTimeframe
  }
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

  // Three parallel queries — chart, stats, table — each scoped to the same range
  const [chartData, stats, { rows, total }] = await Promise.all([
    getHistoryChartData(range),
    getHistoryStats(range),
    getHistoryTableRows(page, PER_PAGE, range),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="py-6 sm:py-8">
      <Container>
        <div className="space-y-8">

          {/* ── 1. Page heading ─────────────────────────────────────────────── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ประวัติราคาทอง</h1>
            <p className="text-sm text-gray-500 mt-1">
              ราคาทองคำแท่ง 96.5% และทองรูปพรรณ บันทึกทุก 5 นาที
            </p>
          </div>

          {/* ── 2. Chart section ─────────────────────────────────────────────── */}
          <section
            aria-labelledby="chart-section-heading"
            className="rounded-card bg-white border border-gray-100 shadow-card p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2
                id="chart-section-heading"
                className="text-sm font-semibold text-gray-700"
              >
                แนวโน้มราคาทอง
              </h2>
              {/* Plain <Link> buttons — clicking triggers server re-render with new range */}
              <HistoryTimeframeNav active={range} />
            </div>

            {/* Client component — metric toggle switches displayed column locally,
                no re-fetch. All 4 price columns are already in chartData.          */}
            <HistoryChart data={chartData} activeRange={range} />
          </section>

          {/* ── 3. Stat cards (bar sell by default) ─────────────────────────── */}
          <StatCards stats={stats} range={range} />

          <Divider />

          {/* ── 4. Historical table with pagination ─────────────────────────── */}
          <HistoryTable
            rows={rows}
            page={page}
            totalPages={totalPages}
            total={total}
            range={range}
            perPage={PER_PAGE}
          />

          {/* ── 5. Ad slot ──────────────────────────────────────────────────── */}
          <AdRectangle />

          {/* ── 6. Methodology note ─────────────────────────────────────────── */}
          <MethodologyNote />

        </div>
      </Container>
    </div>
  )
}
