import type { Metadata } from 'next'

import { getLatestSnapshot }  from '@/lib/queries/prices'
import { buildMetadata }      from '@/lib/utils/metadata'
import { Container }          from '@/components/layout/Container'
import { GoldCalculator }     from '@/components/calculator/GoldCalculator'
import { LastUpdated }        from '@/components/price/LastUpdated'
import { AdRectangle }        from '@/components/ads/AdRectangle'
import { Divider }            from '@/components/ui/Divider'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'เครื่องคิดเลขทอง — คำนวณมูลค่าทองคำ',
  description: 'คำนวณมูลค่าทองจากน้ำหนักและความบริสุทธิ์ด้วยราคาปัจจุบัน รองรับหน่วยบาทน้ำหนักและกรัม ทอง 96.5% 99.99% 90% 80% 75% และกำหนดเอง',
  canonical:   '/calculator',
})

export const revalidate = 300

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoPriceState() {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-10 text-center space-y-2">
      <p className="text-3xl select-none">⏳</p>
      <p className="text-base font-semibold text-gray-700">ยังไม่มีข้อมูลราคาทอง</p>
      <p className="text-sm text-gray-400">
        ราคาจะพร้อมใช้งานหลังจากระบบดึงข้อมูลครั้งแรก (ทุก 5 นาที)
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CalculatorPage() {
  const latest = await getLatestSnapshot()

  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">
        <div className="space-y-8">

          {/* ── 1. Intro ──────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">คำนวณมูลค่าทอง</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              ประมาณมูลค่าทองจากน้ำหนักและความบริสุทธิ์
              โดยอ้างอิงราคาล่าสุดจากสมาคมค้าทองคำ
            </p>
            {latest && <LastUpdated timestamp={latest.fetchedAt} />}
          </div>

          {/* ── 2. Calculator form + result ──────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6 sm:p-8">
            {latest ? (
              <GoldCalculator
                goldBarBuy={latest.goldBarBuy}
                goldBarSell={latest.goldBarSell}
              />
            ) : (
              <NoPriceState />
            )}
          </div>

          <Divider />

          {/* ── 3. How it's calculated ────────────────────────────────────────── */}
          <section aria-labelledby="how-heading" className="space-y-4">
            <h2 id="how-heading" className="text-lg font-semibold text-gray-900">
              วิธีคำนวณมูลค่าทอง
            </h2>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-3 text-sm text-gray-700">
              <p className="font-medium text-gray-800">สูตรที่ใช้:</p>
              <div className="rounded-lg bg-white border border-gray-200 px-4 py-3 font-mono text-sm text-gray-800">
                มูลค่า = น้ำหนัก (บาท) × (ความบริสุทธิ์ ÷ 96.5) × ราคาต่อบาท
              </div>
              <p className="text-gray-500 text-xs">
                ตัวอย่าง: ทอง 96.5% หนัก 2 บาท ราคาขายบาทละ 47,500 บาท<br />
                มูลค่า = 2 × (96.5 ÷ 96.5) × 47,500 = <strong className="text-gray-700">95,000 บาท</strong>
              </p>
            </div>

            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-gold-500 shrink-0 mt-0.5">▸</span>
                <span>
                  <strong className="text-gray-800">1 บาทน้ำหนัก</strong>{' '}
                  เท่ากับ 15.244 กรัม — เป็นหน่วยมาตรฐานสำหรับทองในประเทศไทย
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold-500 shrink-0 mt-0.5">▸</span>
                <span>
                  <strong className="text-gray-800">ราคาอ้างอิง</strong>{' '}
                  ใช้ราคาทองคำแท่ง 96.5% จากสมาคมค้าทองคำ (YGTA) เป็นฐาน
                  แล้วปรับตามสัดส่วนความบริสุทธิ์
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold-500 shrink-0 mt-0.5">▸</span>
                <span>
                  <strong className="text-gray-800">ราคาซื้อ vs รับซื้อ</strong>{' '}
                  ราคาขาย (คุณซื้อทอง) สูงกว่าราคารับซื้อ (คุณขายทอง)
                  ส่วนต่างนี้คือกำไรของร้านทอง
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold-500 shrink-0 mt-0.5">▸</span>
                <span>
                  <strong className="text-gray-800">ค่ากำเหน็จ</strong>{' '}
                  ไม่ได้รวมอยู่ในการคำนวณ ทองรูปพรรณมีค่ากำเหน็จเพิ่มเติมประมาณ
                  400–700 บาทต่อบาทน้ำหนัก ขึ้นอยู่กับร้าน
                </span>
              </li>
            </ul>
          </section>

          <Divider />

          {/* ── 4. FAQ ───────────────────────────────────────────────────────── */}
          <section aria-labelledby="faq-heading" className="space-y-4">
            <h2 id="faq-heading" className="text-lg font-semibold text-gray-900">
              คำถามที่พบบ่อย
            </h2>
            <dl className="space-y-2">
              {CALCULATOR_FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl bg-white border border-gray-100 shadow-card overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none text-gray-900 font-medium text-sm hover:bg-gray-50 transition-colors">
                    <dt>{item.q}</dt>
                    <span
                      className="shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200"
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </summary>
                  <dd className="px-5 pb-4 pt-0 text-sm text-gray-600 leading-[1.8] border-t border-gray-50">
                    {item.a}
                  </dd>
                </details>
              ))}
            </dl>
          </section>

          {/* ── 5. Ad slot ───────────────────────────────────────────────────── */}
          <AdRectangle />

          {/* ── 6. Disclaimer ────────────────────────────────────────────────── */}
          <p className="text-xs text-gray-400 leading-relaxed text-center pb-2">
            ข้อมูลและผลการคำนวณบนหน้านี้มีวัตถุประสงค์เพื่อเป็นข้อมูลอ้างอิงทั่วไปเท่านั้น
            ไม่ถือเป็นคำแนะนำทางการเงินหรือการลงทุน
            ควรตรวจสอบราคาจากร้านทองโดยตรงก่อนทำธุรกรรมทุกครั้ง
          </p>

        </div>
      </Container>
    </div>
  )
}

// ─── Calculator FAQ data ───────────────────────────────────────────────────────

const CALCULATOR_FAQ: { q: string; a: string }[] = [
  {
    q: 'ค่าที่คำนวณได้แม่นยำแค่ไหน?',
    a: 'ผลลัพธ์เป็นค่าประมาณที่ใกล้เคียงราคาจริง โดยใช้ราคามาตรฐานของสมาคมค้าทองคำเป็นฐาน อย่างไรก็ตาม ราคาจริงที่ร้านทองอาจแตกต่างเล็กน้อยเนื่องจากความล่าช้าของข้อมูล ค่าธรรมเนียม และนโยบายของแต่ละร้าน',
  },
  {
    q: '1 บาทน้ำหนักทองเท่ากับกี่กรัม?',
    a: '1 บาทน้ำหนักทองเท่ากับ 15.244 กรัม ซึ่งเป็นหน่วยมาตรฐานที่ใช้ในการซื้อขายทองในประเทศไทย ไม่ใช่หน่วยเงินบาท เครื่องคิดเลขนี้แปลงหน่วยให้อัตโนมัติ',
  },
  {
    q: 'ทองรูปพรรณมีค่ากำเหน็จอีกไหม?',
    a: 'ใช่ ทองรูปพรรณมีค่ากำเหน็จ (ค่าแรงขึ้นรูป) เพิ่มเติมจากราคาทองอีกประมาณ 400–700 บาทต่อบาทน้ำหนัก ขึ้นอยู่กับลวดลายและร้านค้า เครื่องคิดเลขนี้คำนวณเฉพาะมูลค่าทองบริสุทธิ์ ไม่รวมค่ากำเหน็จ',
  },
  {
    q: 'ทำไมราคาซื้อกับขายถึงต่างกัน?',
    a: 'ส่วนต่างระหว่างราคาขาย (ที่คุณจ่ายเพื่อซื้อทอง) กับราคารับซื้อ (ที่คุณได้รับเมื่อขายทอง) คือกำไรของร้านทอง โดยทั่วไปทองแท่งมีส่วนต่างประมาณ 100 บาทต่อบาทน้ำหนัก',
  },
  {
    q: 'ทอง 99.99% ต่างจากทองแท่ง 96.5% อย่างไร?',
    a: 'ทอง 99.99% คือทองบริสุทธิ์สูง (24K) มักพบในทองคำแผ่นสำหรับนักลงทุนและทองต่างประเทศ ส่วนทอง 96.5% เป็นมาตรฐานทองแท่งในประเทศไทย ราคาต่อบาทน้ำหนักของ 99.99% สูงกว่าเล็กน้อยเนื่องจากมีปริมาณทองมากกว่า',
  },
  {
    q: 'ทอง 75% หรือ 18K คืออะไร?',
    a: 'ทอง 18 กะรัต (18K) มีความบริสุทธิ์ 75% (18 ÷ 24 = 75%) มักพบในเครื่องประดับทองคำขาวหรือทองสีพิเศษ มูลค่าต่อหน่วยน้ำหนักต่ำกว่าทองแท่ง 96.5% เนื่องจากมีทองน้อยกว่า',
  },
]
