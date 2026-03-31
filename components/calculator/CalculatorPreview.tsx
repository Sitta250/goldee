'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPriceTHB, formatPrice } from '@/lib/utils/format'
import { calculateGoldValue } from '@/lib/utils/trend'

interface CalculatorPreviewProps {
  goldBarSell: number
}

export function CalculatorPreview({ goldBarSell }: CalculatorPreviewProps) {
  const [weight, setWeight] = useState<string>('1')
  const weightNum = parseFloat(weight) || 0
  const result = calculateGoldValue(weightNum, 96.5, goldBarSell)

  return (
    <div className="rounded-card bg-white border border-gray-100 shadow-card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">คำนวณมูลค่าทองด่วน</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          ทองคำแท่ง 96.5% · ราคาขาย ฿{formatPrice(goldBarSell)} / บาท
        </p>
      </div>

      {/* Quick weight input */}
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
          className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-base font-medium text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400 tabular-nums"
        />
        <span className="text-sm text-gray-600">บาท</span>
      </div>

      {/* Result */}
      <div className="rounded-lg bg-gold-50 border border-gold-100 px-4 py-3">
        <p className="text-xs text-gold-700 mb-0.5">มูลค่าโดยประมาณ</p>
        <p
          className="text-2xl font-bold text-gray-900 tabular-nums"
          aria-live="polite"
        >
          {weightNum > 0 ? formatPriceTHB(result) : '฿—'}
        </p>
      </div>

      <Link
        href="/calculator"
        className="block text-center rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium py-2.5 transition-colors"
      >
        เปิดเครื่องคิดเลขทองเต็มหน้าจอ →
      </Link>
    </div>
  )
}
