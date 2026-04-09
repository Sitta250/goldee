'use client'

import type { LatestPriceData, PriceChange } from '@/types/gold'
import { PriceCard }          from './PriceCard'
import { PriceChangeDisplay } from './PriceChange'
import { LastUpdated }        from './LastUpdated'
import { useCurrency }        from '@/contexts/CurrencyContext'

interface PriceHeroProps {
  data:                 LatestPriceData
  /** Change vs yesterday's UTC+7 midnight close — shown as a second delta row */
  changeFromYesterday?: PriceChange | null
}

export function PriceHero({ data, changeFromYesterday }: PriceHeroProps) {
  const { snapshot, change } = data
  const { isUsd } = useCurrency()

  return (
    <section aria-labelledby="price-hero-heading" className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 id="price-hero-heading" className="text-2xl font-bold text-gray-900 tracking-tight">
            ราคาทองวันนี้
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isUsd
              ? '1 บาทน้ำหนัก = 15.244 กรัม · USD'
              : '1 บาทน้ำหนัก = 15.244 กรัม · THB'}
          </p>
        </div>
        <LastUpdated
          fetchedAt={snapshot.fetchedAt}
          capturedAt={snapshot.capturedAt}
          sourceName={snapshot.sourceName}
        />
      </div>

      {/* Change indicators — vs previous update and vs yesterday close */}
      <div className="space-y-1.5">
        <PriceChangeDisplay change={change} label="เทียบก่อนหน้า" />
        {changeFromYesterday && (
          <PriceChangeDisplay change={changeFromYesterday} label="เทียบเมื่อวาน" />
        )}
      </div>

      {/* Price cards grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <PriceCard label="ทองคำแท่ง" sublabel="96.5%" value={snapshot.goldBarBuy}   type="buy"  />
          <PriceCard label="ทองคำแท่ง" sublabel="96.5%" value={snapshot.goldBarSell}  type="sell" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PriceCard label="ทองรูปพรรณ" sublabel="96.5%" value={snapshot.jewelryBuy}  type="buy"  />
          <PriceCard label="ทองรูปพรรณ" sublabel="96.5%" value={snapshot.jewelrySell} type="sell" />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        * ราคาทองรูปพรรณอาจแตกต่างตามร้านค้า ข้อมูลนี้เป็นราคาอ้างอิงเท่านั้น
      </p>
    </section>
  )
}
