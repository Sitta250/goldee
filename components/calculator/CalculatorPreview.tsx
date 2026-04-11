'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatPriceTHB, formatPrice } from '@/lib/utils/format'
import { calculateGoldValue } from '@/lib/utils/trend'

interface CalculatorPreviewProps {
  goldBarSell: number
}

// Common Thai gold queries surfaced as one-tap chips
const EXAMPLE_INTENTS: { label: string; weight: string }[] = [
  { label: 'ขายทอง 1 บาท', weight: '1' },
  { label: 'ขายทอง 2 บาท', weight: '2' },
  { label: '0.5 บาท เท่าไร?', weight: '0.5' },
]

export function CalculatorPreview({ goldBarSell }: CalculatorPreviewProps) {
  const [weight, setWeight] = useState<string>('1')
  const weightNum = parseFloat(weight) || 0
  const result = calculateGoldValue(weightNum, 96.5, goldBarSell)

  return (
    <div className="rounded-card bg-white border border-gray-100 shadow-card p-4 sm:p-5 space-y-3 sm:space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">คำนวณมูลค่าทองคำ</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          ทองคำแท่ง 96.5% · ราคาขาย{' '}
          <span className="font-medium tabular-nums text-gray-600">
            ฿{formatPrice(goldBarSell)}
          </span>{' '}
          / บาท
        </p>
      </div>

      {/* Example intent chips — tap to prefill weight */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_INTENTS.map(({ label, weight: w }) => (
          <button
            key={w}
            type="button"
            onClick={() => setWeight(w)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              weight === w
                ? 'border-gold-400 bg-gold-50 text-gold-700'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Weight input */}
      <div className="flex items-center gap-2">
        <label htmlFor="preview-weight" className="text-sm text-gray-600 shrink-0">
          น้ำหนัก
        </label>
        <input
          id="preview-weight"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min="0"
          step="0.5"
          inputMode="decimal"
          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-base font-semibold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400 tabular-nums"
        />
        <span className="text-sm text-gray-600">บาท</span>
      </div>

      {/* Result */}
      <div className="rounded-xl bg-gold-50 border border-gold-100 px-4 py-3.5">
        <p className="text-xs text-gold-700 mb-1">มูลค่าโดยประมาณ</p>
        <p
          className="text-2xl font-bold text-gray-900 tabular-nums"
          aria-live="polite"
        >
          {weightNum > 0 ? formatPriceTHB(result) : '฿—'}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/calculator"
        className="block text-center rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold py-3 transition-colors"
      >
        คำนวณมูลค่าทองแบบละเอียด — เลือกประเภท น้ำหนัก และความบริสุทธิ์ <ArrowRight size={14} className="inline" aria-hidden />
      </Link>

    </div>
  )
}
