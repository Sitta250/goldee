import type { GoldPriceSnapshot } from '@/types/gold'
import { formatPrice, formatDateTime } from '@/lib/utils/format'

interface PriceTableProps {
  rows: GoldPriceSnapshot[]
  // Optional: highlight the latest row
  highlightFirst?: boolean
}

export function PriceTable({ rows, highlightFirst = true }: PriceTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        ยังไม่มีข้อมูลราคา
      </p>
    )
  }

  return (
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
                highlightFirst && i === 0 ? 'bg-gold-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                <time dateTime={row.fetchedAt.toISOString()}>
                  {formatDateTime(row.fetchedAt)}
                </time>
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                {formatPrice(row.goldBarSell)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                {formatPrice(row.goldBarBuy)}
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
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
  )
}
