'use client'

import { useState } from 'react'
import { formatPrice, formatPriceTHB } from '@/lib/utils/format'
import { calculateGoldValue, gramsToBaht } from '@/lib/utils/trend'
import type { WeightUnit, TransactionType } from '@/types/gold'

interface GoldCalculatorProps {
  goldBarBuy: number
  goldBarSell: number
}

const PURITY_OPTIONS = [
  { value: 96.5, label: '96.5% — ทองคำแท่งมาตรฐาน' },
  { value: 90,   label: '90% — ทองเก่า' },
  { value: 80,   label: '80% — ทอง 18K' },
]

export function GoldCalculator({ goldBarBuy, goldBarSell }: GoldCalculatorProps) {
  const [weight, setWeight]           = useState<string>('1')
  const [unit, setUnit]               = useState<WeightUnit>('baht')
  const [purity, setPurity]           = useState<number>(96.5)
  const [txType, setTxType]           = useState<TransactionType>('sell')

  const weightNum   = parseFloat(weight) || 0
  const weightBaht  = unit === 'gram' ? gramsToBaht(weightNum) : weightNum
  const pricePerBaht = txType === 'sell' ? goldBarSell : goldBarBuy
  const result      = calculateGoldValue(weightBaht, purity, pricePerBaht)

  return (
    <div className="space-y-6">
      {/* Weight + Unit */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-2">
          น้ำหนักทอง
        </legend>
        <div className="flex gap-2">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="0"
            step="0.1"
            aria-label="น้ำหนักทอง"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400 tabular-nums"
            placeholder="0"
          />
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['baht', 'gram'] as WeightUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  unit === u
                    ? 'bg-gold-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {u === 'baht' ? 'บาท' : 'กรัม'}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Purity */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-2">
          ความบริสุทธิ์
        </legend>
        <div className="space-y-2">
          {PURITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="purity"
                value={opt.value}
                checked={purity === opt.value}
                onChange={() => setPurity(opt.value)}
                className="w-4 h-4 accent-gold-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Transaction type */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-2">
          ประเภทธุรกรรม
        </legend>
        <div className="flex gap-2">
          {(['sell', 'buy'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTxType(t)}
              aria-pressed={txType === t}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                txType === t
                  ? t === 'sell'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t === 'sell' ? 'ซื้อทอง (ราคาขาย)' : 'ขายทอง (ราคารับซื้อ)'}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          ใช้ราคา{txType === 'sell' ? 'ขาย' : 'รับซื้อ'}: ฿{formatPrice(pricePerBaht)} / บาท
        </p>
      </fieldset>

      {/* Result */}
      <div className="rounded-card bg-gold-50 border border-gold-200 p-5 space-y-1">
        <p className="text-sm text-gold-700 font-medium">มูลค่าโดยประมาณ</p>
        <p
          className="text-price-lg font-bold text-gray-900 tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {weightNum > 0 ? formatPriceTHB(result) : '฿—'}
        </p>
        {weightNum > 0 && (
          <p className="text-xs text-gray-500">
            {weight} {unit === 'baht' ? 'บาท' : 'กรัม'} × ความบริสุทธิ์ {purity}%
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        * มูลค่าที่คำนวณเป็นค่าโดยประมาณ ราคาจริงอาจแตกต่างตามร้านค้าและเวลา
        สูตร: น้ำหนัก (บาท) × (ความบริสุทธิ์ / 96.5) × ราคาต่อบาท
      </p>
    </div>
  )
}
