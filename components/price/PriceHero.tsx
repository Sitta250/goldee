'use client'

import type { LatestPriceData } from '@/types/gold'
import { PriceCard }         from './PriceCard'
import { PriceChangeDisplay } from './PriceChange'
import { LastUpdated }        from './LastUpdated'
import { useCurrency }        from '@/contexts/CurrencyContext'

interface PriceHeroProps {
  data: LatestPriceData
}

export function PriceHero({ data }: PriceHeroProps) {
  const { snapshot, change } = data
  const { isUsd } = useCurrency()

  return (
    <section aria-labelledby="price-hero-heading" className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 id="price-hero-heading" className="text-2xl font-bold text-gray-900">
            ราคาทองวันนี้
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isUsd
              ? 'ราคาในหน่วย USD (1 บาทน้ำหนัก = 15.244 กรัม)'
              : 'ราคาในหน่วย บาท (1 บาท = 15.244 กรัม)'}
          </p>
        </div>
        <LastUpdated timestamp={snapshot.fetchedAt} />
      </div>

      {/* Change indicator */}
      <PriceChangeDisplay change={change} />

      {/* Two rows: ทองแท่ง row, ทองรูปพรรณ row */}
      <div className="space-y-3">
        {/* Row 1 — ทองคำแท่ง */}
        <div className="grid grid-cols-2 gap-3">
          <PriceCard
            label="ทองคำแท่ง"
            sublabel="96.5%"
            value={snapshot.goldBarSell}
            type="sell"
          />
          <PriceCard
            label="ทองคำแท่ง"
            sublabel="96.5%"
            value={snapshot.goldBarBuy}
            type="buy"
          />
        </div>

        {/* Row 2 — ทองรูปพรรณ */}
        <div className="grid grid-cols-2 gap-3">
          <PriceCard
            label="ทองรูปพรรณ"
            sublabel="96.5%"
            value={snapshot.jewelrySell}
            type="sell"
          />
          <PriceCard
            label="ทองรูปพรรณ"
            sublabel="96.5%"
            value={snapshot.jewelryBuy}
            type="buy"
          />
        </div>
      </div>

      {/* Unit note */}
      <p className="text-xs text-gray-400">
        * ราคาทองรูปพรรณอาจแตกต่างตามร้านค้า ข้อมูลนี้เป็นราคาอ้างอิงเท่านั้น
      </p>
    </section>
  )
}
