import Link from 'next/link'
import type { HistoryTableRow, HistoryTimeframe } from '@/lib/queries/history'
import { formatPrice, formatDateTime } from '@/lib/utils/format'

interface HistoryTableProps {
  rows:       HistoryTableRow[]
  page:       number
  totalPages: number
  total:      number
  range:      HistoryTimeframe
  perPage:    number
}

export function HistoryTable({
  rows,
  page,
  totalPages,
  total,
  range,
  perPage,
}: HistoryTableProps) {
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      i === 0 && page === 1 ? 'bg-gold-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <time dateTime={row.fetchedAt.toISOString()}>
                        {formatDateTime(row.fetchedAt)}
                      </time>
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} range={range} />
          )}
        </>
      )}
    </section>
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
  const prev = page - 1
  const next = page + 1

  function pageHref(p: number) {
    return `/history?range=${range}&page=${p}`
  }

  // Show at most 5 page numbers around the current page
  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav
      aria-label="การแบ่งหน้า"
      className="flex items-center justify-center gap-1 flex-wrap"
    >
      {/* Prev */}
      {page > 1 ? (
        <Link
          href={pageHref(prev)}
          className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ← ก่อนหน้า
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md text-sm text-gray-300 bg-gray-50 cursor-not-allowed">
          ← ก่อนหน้า
        </span>
      )}

      {/* First page + ellipsis */}
      {start > 1 && (
        <>
          <Link href={pageHref(1)} className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">
            1
          </Link>
          {start > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
        </>
      )}

      {/* Page numbers */}
      {pages.map((p) =>
        p === page ? (
          <span
            key={p}
            aria-current="page"
            className="px-3 py-1.5 rounded-md text-sm font-semibold bg-gold-500 text-white shadow-sm"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {p}
          </Link>
        ),
      )}

      {/* Last page + ellipsis */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
          <Link href={pageHref(totalPages)} className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200">
            {totalPages}
          </Link>
        </>
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link
          href={pageHref(next)}
          className="px-3 py-1.5 rounded-md text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ถัดไป →
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md text-sm text-gray-300 bg-gray-50 cursor-not-allowed">
          ถัดไป →
        </span>
      )}
    </nav>
  )
}
