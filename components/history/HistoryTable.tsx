import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { HistoryTableRow, HistoryTimeframe } from '@/lib/queries/history'
import { formatPrice, formatDateTime } from '@/lib/utils/format'

// ─── Gap detection ────────────────────────────────────────────────────────────

/**
 * Maximum days between consecutive rows before we consider it a data gap.
 * Weekends naturally produce 1-2 day gaps; beyond the threshold something is wrong.
 */
const GAP_THRESHOLD_DAYS: Record<HistoryTimeframe, number> = {
  '7D':  3,
  '30D': 5,
  '6M':  10,
  '1Y':  20,
  'All': 40,
}

const DAY_MS = 1000 * 60 * 60 * 24

/** Oldest first; stable id tie-break (matches history query). */
function compareRowChronoAsc(a: HistoryTableRow, b: HistoryTableRow): number {
  const t = a.canonicalAt.getTime() - b.canonicalAt.getTime()
  if (t !== 0) return t
  return a.id.localeCompare(b.id)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HistoryTableProps {
  rows:                   HistoryTableRow[]
  page:                   number
  totalPages:             number
  total:                  number
  range:                  HistoryTimeframe
  perPage:                number
  hasAnnouncementNumbers: boolean
  olderRowBarSell:        number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HistoryTable({
  rows,
  page,
  totalPages,
  total,
  range,
  perPage,
  hasAnnouncementNumbers,
  olderRowBarSell,
}: HistoryTableProps) {
  const start  = (page - 1) * perPage + 1
  const end    = Math.min(page * perPage, total)
  const colSpan = hasAnnouncementNumbers ? 7 : 6
  const threshold = GAP_THRESHOLD_DAYS[range]

  // Delta vs chronological predecessor (display order may be 1 then N within a day)
  const sortedAsc = [...rows].sort(compareRowChronoAsc)
  const predBarSellById = new Map<string, number | null>()
  for (let i = 0; i < sortedAsc.length; i++) {
    const pred = i === 0 ? olderRowBarSell : sortedAsc[i - 1].goldBarSell
    predBarSellById.set(sortedAsc[i].id, pred)
  }
  const deltas: (number | null)[] = rows.map((row) => {
    const p = predBarSellById.get(row.id)
    if (p === null || p === undefined) return null
    return row.goldBarSell - p
  })

  // Gap strip when adjacent *display* rows are far apart in wall time (e.g. missing days)
  const afterGap: boolean[] = rows.map((row, i) => {
    if (i === 0) return false
    const daySpan =
      Math.abs(rows[i - 1].canonicalAt.getTime() - row.canonicalAt.getTime()) / DAY_MS
    return daySpan > threshold
  })

  return (
    <section aria-labelledby="table-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h2 id="table-heading" className="text-base font-semibold text-gray-900">
          ตารางราคาย้อนหลัง
        </h2>
        {total > 0 && (
          <p className="text-xs text-gray-400">
            แสดง {start}–{end} จากทั้งหมด {total.toLocaleString('th-TH')} รายการ
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          ยังไม่มีข้อมูลราคาสำหรับช่วงเวลานี้
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-gray-100 shadow-card">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    วันที่ / เวลา
                  </th>
                  {hasAnnouncementNumbers && (
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-center">
                      ครั้งที่
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
                    แท่ง ขาย
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
                    แท่ง ซื้อ
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
                    รูปพรรณ ขาย
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
                    รูปพรรณ ซื้อ
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
                    เปลี่ยนแปลง
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {rows.map((row, i) => {
                  const isAfterGap = afterGap[i]
                  // Suppress delta when crossing a gap — the jump is a data discontinuity,
                  // not a real price movement.
                  const delta = isAfterGap ? null : deltas[i]

                  return (
                    <>
                      {/* Gap separator — shown above the first row after a gap */}
                      {isAfterGap && (
                        <tr key={`gap-${row.id}`} className="bg-amber-50 border-y border-amber-100">
                          <td
                            colSpan={colSpan}
                            className="px-4 py-2 text-center text-xs text-amber-700 font-medium"
                          >
                            <AlertTriangle size={13} className="inline mr-1" aria-hidden />ข้อมูลขาดช่วง{' '}
                            {Math.round(
                              Math.abs(
                                rows[i - 1].canonicalAt.getTime() - row.canonicalAt.getTime(),
                              ) / DAY_MS,
                            )}{' '}
                            วัน — อาจมีความไม่ต่อเนื่องของราคา
                          </td>
                        </tr>
                      )}

                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-gray-50 ${
                          i === 0 && page === 1 ? 'bg-gold-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          <time dateTime={row.canonicalAt.toISOString()}>
                            {formatDateTime(row.canonicalAt)}
                          </time>
                        </td>
                        {hasAnnouncementNumbers && (
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap tabular-nums text-xs text-center">
                            {row.dayOrdinalDisplay ?? row.announcementNumber ?? '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                          {formatPrice(row.goldBarSell)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                          {formatPrice(row.goldBarBuy)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                          {formatPrice(row.jewelrySell)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                          {formatPrice(row.jewelryBuy)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                          <DeltaBadge delta={delta} />
                        </td>
                      </tr>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} range={range} />
          )}
        </>
      )}
    </section>
  )
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-gray-300">—</span>
  if (delta === 0)    return <span className="text-gray-400 text-xs">0.00</span>

  const positive = delta > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        positive ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {positive ? '▲' : '▼'}
      {formatPrice(Math.abs(delta))}
    </span>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  range,
}: {
  page:       number
  totalPages: number
  range:      HistoryTimeframe
}) {
  function pageHref(p: number) {
    return `/history?range=${range}&page=${p}`
  }

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav
      aria-label="การแบ่งหน้า"
      className="flex items-center justify-center gap-1 flex-wrap"
    >
      {page > 1 ? (
        <Link href={pageHref(page - 1)} scroll={false}
          className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          ← ก่อนหน้า
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md text-sm text-gray-300 bg-gray-50 cursor-not-allowed">
          ← ก่อนหน้า
        </span>
      )}

      {start > 1 && (
        <>
          <Link href={pageHref(1)} scroll={false}
            className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">
            1
          </Link>
          {start > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
        </>
      )}

      {pages.map((p) =>
        p === page ? (
          <span key={p} aria-current="page"
            className="px-3 py-1.5 rounded-md text-sm font-semibold bg-gold-500 text-white shadow-sm">
            {p}
          </span>
        ) : (
          <Link key={p} href={pageHref(p)} scroll={false}
            className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            {p}
          </Link>
        ),
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
          <Link href={pageHref(totalPages)} scroll={false}
            className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">
            {totalPages}
          </Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={pageHref(page + 1)} scroll={false}
          className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          ถัดไป <ArrowRight size={13} className="inline" aria-hidden />
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md text-sm text-gray-300 bg-gray-50 cursor-not-allowed">
          ถัดไป <ArrowRight size={13} className="inline" aria-hidden />
        </span>
      )}
    </nav>
  )
}
