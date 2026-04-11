'use client'

import { useState, useId } from 'react'
import { AlertTriangle } from 'lucide-react'
import { formatPrice, formatPriceTHB, formatWeight } from '@/lib/utils/format'
import { calculateGoldValue, gramsToBaht, bahtToGrams } from '@/lib/utils/trend'
import type { WeightUnit, TransactionType } from '@/types/gold'

// ─── Types ────────────────────────────────────────────────────────────────────

type PurityPreset = 96.5 | 99.99 | 90 | 80 | 75 | 'custom'

interface GoldCalculatorProps {
  goldBarBuy:      number
  goldBarSell:     number
  initialTxType?:  TransactionType
}

// ─── Purity presets ───────────────────────────────────────────────────────────

const PURITY_PRESETS: { value: PurityPreset; label: string; sublabel: string }[] = [
  { value: 96.5,     label: '96.5%',    sublabel: 'ทองแท่งไทย' },
  { value: 99.99,    label: '99.99%',   sublabel: 'ทองบริสุทธิ์' },
  { value: 90,       label: '90%',      sublabel: 'ทองเก่า' },
  { value: 80,       label: '80%',      sublabel: '' },
  { value: 75,       label: '75%',      sublabel: '18K' },
  { value: 'custom', label: 'กำหนดเอง', sublabel: '' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function GoldCalculator({ goldBarBuy, goldBarSell, initialTxType }: GoldCalculatorProps) {
  const weightId  = useId()
  const customId  = useId()

  const [weightStr,    setWeightStr]    = useState('1')
  const [unit,         setUnit]         = useState<WeightUnit>('baht')
  const [purityPreset, setPurityPreset] = useState<PurityPreset>(96.5)
  const [customPurity, setCustomPurity] = useState('96.5')
  const [txType,       setTxType]       = useState<TransactionType>(initialTxType ?? 'sell')

  // ── Derived values ──────────────────────────────────────────────────────────
  const weightNum   = Math.max(0, parseFloat(weightStr) || 0)
  const weightBaht  = unit === 'gram' ? gramsToBaht(weightNum) : weightNum
  const weightGrams = unit === 'baht' ? bahtToGrams(weightNum) : weightNum

  const activePurity: number =
    purityPreset === 'custom'
      ? Math.min(99.99, Math.max(0, parseFloat(customPurity) || 0))
      : purityPreset

  const pricePerBaht = txType === 'sell' ? goldBarSell : goldBarBuy
  const result       = calculateGoldValue(weightBaht, activePurity, pricePerBaht)
  const hasResult    = weightNum > 0 && activePurity > 0 && pricePerBaht > 0

  return (
    <div className="space-y-7">

      {/* ── 1. Weight ─────────────────────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-3">
          น้ำหนักทอง
        </legend>
        <div className="flex gap-2 items-stretch">
          <div className="flex-1">
            <label htmlFor={weightId} className="sr-only">น้ำหนัก</label>
            <input
              id={weightId}
              type="number"
              value={weightStr}
              onChange={(e) => setWeightStr(e.target.value)}
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xl font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400 tabular-nums"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
            {(['baht', 'gram'] as WeightUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`px-5 py-3 text-sm font-semibold transition-colors ${
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
        {weightNum > 0 && (
          <p className="mt-2 text-xs text-gray-400">
            {unit === 'baht'
              ? `= ${formatWeight(weightGrams, 'gram')}`
              : `= ${formatWeight(weightBaht, 'baht')}`}
          </p>
        )}
      </fieldset>

      {/* ── 2. Purity ─────────────────────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-3">
          ความบริสุทธิ์
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {PURITY_PRESETS.map((opt) => {
            const isActive = purityPreset === opt.value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setPurityPreset(opt.value)}
                aria-pressed={isActive}
                className={`flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition-colors ${
                  isActive
                    ? 'border-gold-400 bg-gold-50 text-gold-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                {opt.sublabel ? (
                  <span className="text-xs text-gray-400 mt-0.5">{opt.sublabel}</span>
                ) : (
                  <span className="text-xs text-transparent mt-0.5">-</span>
                )}
              </button>
            )
          })}
        </div>

        {purityPreset === 'custom' && (
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor={customId} className="text-sm text-gray-600 shrink-0">
              ระบุความบริสุทธิ์:
            </label>
            <input
              id={customId}
              type="number"
              value={customPurity}
              onChange={(e) => setCustomPurity(e.target.value)}
              min="0"
              max="99.99"
              step="0.01"
              inputMode="decimal"
              className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400 tabular-nums"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        )}
      </fieldset>

      {/* ── 3. Transaction type ───────────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-3">
          ซื้อ หรือ ขายทอง?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTxType('sell')}
            aria-pressed={txType === 'sell'}
            className={`rounded-xl border-2 py-3.5 px-4 text-sm transition-colors ${
              txType === 'sell'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="block text-lg leading-none mb-1">🛒</span>
            <span className="block font-semibold">ซื้อทอง</span>
            <span className="block text-xs font-normal text-gray-400 mt-0.5">
              ฿{formatPrice(goldBarSell)} / บาท
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('buy')}
            aria-pressed={txType === 'buy'}
            className={`rounded-xl border-2 py-3.5 px-4 text-sm transition-colors ${
              txType === 'buy'
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="block text-lg leading-none mb-1">💰</span>
            <span className="block font-semibold">ขายทอง</span>
            <span className="block text-xs font-normal text-gray-400 mt-0.5">
              ฿{formatPrice(goldBarBuy)} / บาท
            </span>
          </button>
        </div>
      </fieldset>

      {/* ── 4. Result card ────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border-2 p-5 space-y-4 transition-colors ${
        hasResult
          ? 'border-gold-200 bg-gold-50'
          : 'border-gray-100 bg-gray-50'
      }`}>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            มูลค่าโดยประมาณ
          </p>
          <p
            className="text-price-lg font-bold text-gray-900 tabular-nums leading-none"
            aria-live="polite"
            aria-atomic="true"
          >
            {hasResult ? formatPriceTHB(result) : '฿—'}
          </p>
        </div>

        {hasResult && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-gold-100 pt-3">
            <dt className="text-gray-500">น้ำหนัก</dt>
            <dd className="text-gray-900 font-medium tabular-nums text-right">
              {formatWeight(weightBaht, 'baht')}
              <span className="text-gray-400 font-normal">
                {' '}({formatWeight(weightGrams, 'gram')})
              </span>
            </dd>

            <dt className="text-gray-500">ความบริสุทธิ์</dt>
            <dd className="text-gray-900 font-medium text-right">
              {activePurity}%
            </dd>

            <dt className="text-gray-500">
              ราคา{txType === 'sell' ? 'ขาย' : 'รับซื้อ'}/บาท
            </dt>
            <dd className="text-gray-900 font-medium tabular-nums text-right">
              ฿{formatPrice(pricePerBaht)}
            </dd>
          </dl>
        )}
      </div>

      {/* ── 5. Disclaimer ─────────────────────────────────────────────────────── */}
      <p className="flex items-start gap-1.5 text-xs text-gray-400 leading-relaxed">
        <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden />
        <span>
          มูลค่าที่แสดงเป็นค่าประมาณเท่านั้น ราคาจริงอาจต่างจากนี้ขึ้นอยู่กับร้านค้า
          สภาพทอง และเวลาซื้อขาย ค่ากำเหน็จทองรูปพรรณไม่ได้รวมอยู่ในการคำนวณนี้
        </span>
      </p>
    </div>
  )
}
