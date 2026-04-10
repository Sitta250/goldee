import type { Metadata } from 'next'

import { buildMetadata }   from '@/lib/utils/metadata'
import { Container }       from '@/components/layout/Container'
import { ContentSection }  from '@/components/ui/ContentSection'
import { AdRectangle }     from '@/components/ads/AdRectangle'
import { Divider }         from '@/components/ui/Divider'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title:       'เกี่ยวกับ Goldee',
  description: 'Goldee คืออะไร ข้อมูลราคาทองมาจากไหน อัพเดทบ่อยแค่ไหน วิธีคำนวณราคา และข้อจำกัดที่ควรทราบ',
  canonical:   '/about',
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">
        <div className="space-y-10">

          {/* ── Page heading ──────────────────────────────────────────────────── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เกี่ยวกับ Goldee</h1>
            <p className="text-sm text-gray-500 mt-1">
              ทำความรู้จักเว็บไซต์นี้ก่อนนำข้อมูลไปใช้
            </p>
          </div>

          {/* ── 1. What this website is for ───────────────────────────────────── */}
          <ContentSection icon="📌" title="เว็บไซต์นี้ทำอะไร?">
            <p>
              Goldee แสดงราคาทองคำในประเทศไทยแบบเรียลไทม์ โดยดึงข้อมูลจากสมาคมค้าทองคำ (YGTA)
              ซึ่งเป็นองค์กรที่กำหนดราคามาตรฐานสำหรับร้านทองทั่วประเทศ
            </p>
            <p>
              นอกจากราคาปัจจุบัน เว็บไซต์ยังมีกราฟแนวโน้ม ประวัติราคาย้อนหลัง เครื่องคิดเลขทอง
              และบทความให้ความรู้ ทั้งหมดออกแบบมาให้อ่านง่ายบนมือถือ
            </p>
          </ContentSection>

          <Divider />

          {/* ── 2. Who this website is for ────────────────────────────────────── */}
          <ContentSection icon="👤" title="เหมาะสำหรับใคร?">
            <p>
              เว็บไซต์นี้เหมาะสำหรับ <strong>คนทั่วไปที่ต้องการทราบราคาทองวันนี้</strong>
              ก่อนตัดสินใจซื้อหรือขายทอง ไม่ว่าจะเป็นทองแท่ง ทองรูปพรรณ หรือเครื่องประดับ
            </p>
            <ul className="space-y-2 mt-1">
              {[
                'คนที่กำลังจะซื้อทองเป็นของขวัญหรือเก็บออม',
                'คนที่มีทองเก่าและต้องการประเมินมูลค่าก่อนขาย',
                'มือใหม่ที่เพิ่งเริ่มสนใจทองและอยากเข้าใจราคา',
                'ผู้ที่ต้องการติดตามแนวโน้มราคาทองในระยะยาว',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-gold-400 shrink-0 mt-0.5">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-500">
              เว็บไซต์นี้ <strong className="text-gray-700">ไม่ได้มีไว้สำหรับ</strong>{' '}
              การเทรดทอง การลงทุนเชิงเทคนิค หรือการวิเคราะห์ตลาดขั้นสูง
            </p>
          </ContentSection>

          <Divider />

          {/* ── 3. How price data is fetched ──────────────────────────────────── */}
          <ContentSection id="data-source" icon="🔄" title="ข้อมูลราคามาจากไหน?">
            <p>
              ราคาทองที่แสดงบนเว็บไซต์นี้มาจาก
              <strong> สมาคมค้าทองคำแห่งประเทศไทย (YGTA)</strong>
              ซึ่งเป็นองค์กรที่ออกประกาศราคาทองอย่างเป็นทางการ
              ร้านทองส่วนใหญ่ในประเทศไทยใช้ราคานี้เป็นราคาอ้างอิง
            </p>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
              <p className="font-medium text-gray-800">ขั้นตอนการดึงข้อมูล:</p>
              <ol className="space-y-1.5 list-none">
                {[
                  'ในช่วงประกาศราคา (โดยประมาณ 09:00–18:30 น. เวลาไทย) ระบบส่งคำขอไปยังแหล่งข้อมูลประมาณทุก 5 นาที',
                  'ตรวจสอบความถูกต้องของข้อมูล (ราคาอยู่ในช่วงที่สมเหตุสมผล ฯลฯ)',
                  'ถ้าราคาเปลี่ยนแปลง — บันทึกรายการใหม่ลงฐานข้อมูล',
                  'ถ้าราคาเหมือนเดิม — อัพเดทเวลาล่าสุดเท่านั้น ไม่บันทึกซ้ำ',
                  'หน้าเว็บอัพเดทอัตโนมัติภายในไม่กี่นาทีเมื่อมีข้อมูลใหม่',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-gold-100 text-gold-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </ContentSection>

          <Divider />

          {/* ── 4. Why Thai price differs from global spot ────────────────────── */}
          <ContentSection icon="🌍" title="ทำไมราคาทองไทยกับราคาโลกถึงต่างกัน?">
            <p>
              นักลงทุนหลายคนสังเกตว่าราคาทองในไทยไม่ตรงกับ &ldquo;ราคาโลก&rdquo; ที่เห็นในข่าว
              นั่นเป็นเรื่องปกติ เพราะทั้งสองอ้างอิงคนละสิ่งกัน
            </p>
            <div className="space-y-3">
              {[
                {
                  label: 'หน่วยและน้ำหนักต่างกัน',
                  detail:
                    'ราคาโลก (Spot Price) วัดเป็น ดอลลาร์สหรัฐ ต่อ ทรอยออนซ์ (31.1 กรัม) ' +
                    'ส่วนราคาไทยวัดเป็น บาทไทย ต่อ บาทน้ำหนัก (15.244 กรัม)',
                },
                {
                  label: 'ความบริสุทธิ์ต่างกัน',
                  detail:
                    'ราคาโลกอ้างอิงทอง 99.99% บริสุทธิ์ ' +
                    'ส่วนทองแท่งมาตรฐานไทยบริสุทธิ์ 96.5% จึงมีมูลค่าน้อยกว่าเล็กน้อย',
                },
                {
                  label: 'อัตราแลกเปลี่ยน',
                  detail:
                    'ราคาไทยแปลงมาจากดอลลาร์โดยใช้อัตราแลกเปลี่ยน USD/THB ณ ขณะนั้น ' +
                    'เมื่อบาทอ่อนค่า ราคาทองในไทยก็มักปรับขึ้นตาม แม้ราคาโลกไม่เปลี่ยน',
                },
                {
                  label: 'ส่วนต่างราคาของสมาคม',
                  detail:
                    'สมาคมค้าทองคำประกาศราคาโดยคำนึงถึงต้นทุนนำเข้า ค่าธรรมเนียม ' +
                    'และเสถียรภาพตลาดในประเทศด้วย จึงไม่ได้ขยับตามราคาโลกทันทีทุกนาที',
                },
              ].map(({ label, detail }) => (
                <div key={label} className="rounded-lg bg-white border border-gray-100 px-4 py-3 shadow-card">
                  <p className="font-medium text-gray-800 mb-0.5">{label}</p>
                  <p className="text-gray-600">{detail}</p>
                </div>
              ))}
            </div>
          </ContentSection>

          <Divider />

          {/* ── 5. How often the site updates ─────────────────────────────────── */}
          <ContentSection icon="⏱️" title="ข้อมูลอัพเดทบ่อยแค่ไหน?">
            <p>
              ระบบตรวจสอบราคาใหม่ประมาณ <strong>ทุก 5 นาที</strong> ในช่วงประกาศ (โดยประมาณ{' '}
              <strong>09:00–18:30 น. เวลาไทย</strong>) ซึ่งครอบคลุมจังหวะที่สมาคมค้าทองคำมักประกาศ
              (โดยทั่วไปเช้าและเย็น)
            </p>
            <p>
              นอกช่วงนี้ระบบไม่ดึงราคาใหม่ — แสดงราคาล่าสุดจากตลาด
              ในช่วงประกาศ ราคาอาจไม่เปลี่ยนทุก 5 นาที ระบบจะบันทึกเฉพาะเมื่อราคามีการเปลี่ยนแปลงจริง
              เพื่อไม่ให้ข้อมูลซ้ำซ้อนในฐานข้อมูล
            </p>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-blue-800">
              <p>
                <strong>วันหยุดและวันเสาร์-อาทิตย์:</strong>{' '}
                ราคาจะแสดงราคาปิดล่าสุดจากวันทำการก่อนหน้า
                เนื่องจากตลาดทองปิดทำการ
              </p>
            </div>
          </ContentSection>

          <Divider />

          {/* ── 6. Methodology and limitations ───────────────────────────────── */}
          <ContentSection id="methodology" icon="📐" title="วิธีคำนวณและข้อจำกัด">
            <p className="font-medium text-gray-800">หน่วยที่ใช้ในเว็บไซต์นี้</p>
            <ul className="space-y-1.5">
              {[
                ['1 บาทน้ำหนัก', '= 15.244 กรัม (หน่วยมาตรฐานทองไทย)'],
                ['ทองคำแท่งไทย', '= ความบริสุทธิ์ 96.5%'],
                ['ทอง 18 กะรัต', '= ประมาณ 75% บริสุทธิ์'],
                ['ราคาที่แสดง', '= บาทไทย (THB) ต่อ 1 บาทน้ำหนัก'],
              ].map(([term, def]) => (
                <li key={term as string} className="flex gap-2">
                  <span className="font-medium text-gray-800 shrink-0 w-36">{term}</span>
                  <span className="text-gray-600">{def}</span>
                </li>
              ))}
            </ul>

            <p className="font-medium text-gray-800 pt-1">สูตรคำนวณมูลค่า</p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 font-mono text-xs text-gray-700">
              มูลค่า = น้ำหนัก (บาท) × (ความบริสุทธิ์ ÷ 96.5) × ราคาต่อบาท
            </div>

            <p className="font-medium text-gray-800 pt-1">ข้อจำกัดที่ควรทราบ</p>
            <ul className="space-y-2">
              {[
                'ราคาที่แสดงอาจล่าช้าไม่เกิน 5–10 นาทีจากราคาประกาศจริง',
                'ค่ากำเหน็จทองรูปพรรณ (ค่าแรงขึ้นรูป) ไม่ได้รวมอยู่ในการคำนวณ',
                'ราคาจริงที่ร้านทองอาจแตกต่างเล็กน้อยตามนโยบายของแต่ละร้าน',
                'ข้อมูลย้อนหลังเก็บตั้งแต่วันที่เว็บไซต์เริ่มให้บริการเท่านั้น',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ContentSection>

          <Divider />

          {/* ── 7. Disclaimer ─────────────────────────────────────────────────── */}
          <ContentSection icon="⚖️" title="ข้อจำกัดความรับผิดชอบ">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-amber-900 space-y-2">
              <p>
                ข้อมูลและราคาทองที่แสดงบนเว็บไซต์นี้มีวัตถุประสงค์
                <strong> เพื่อเป็นข้อมูลอ้างอิงทั่วไปเท่านั้น</strong>
              </p>
              <p>
                ไม่ถือเป็นคำแนะนำทางการเงิน การลงทุน หรือการซื้อขายใดๆ
                ราคาที่แสดงอาจแตกต่างจากราคาซื้อขายจริง ณ ร้านทอง
              </p>
              <p>
                Goldee ไม่รับผิดชอบต่อการตัดสินใจทางการเงินหรือความเสียหายใดๆ
                อันเกิดจากการนำข้อมูลบนเว็บไซต์นี้ไปใช้
                กรุณาตรวจสอบราคาจากร้านทองโดยตรงก่อนทำธุรกรรมทุกครั้ง
              </p>
            </div>
          </ContentSection>

          <Divider />

          {/* ── 8. Contact / feedback placeholder ────────────────────────────── */}
          <ContentSection icon="✉️" title="ติดต่อและแจ้งปัญหา">
            <p>
              หากพบข้อมูลที่ผิดพลาด มีข้อสงสัย หรืออยากให้ปรับปรุงเว็บไซต์
              ยินดีรับฟังเสมอ
            </p>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-base shrink-0 mt-0.5">📧</span>
                <div>
                  <p className="font-medium text-gray-800">อีเมล</p>
                  <a
                    href="mailto:hello@goldee.app"
                    className="text-gold-600 hover:underline text-sm"
                  >
                    hello@goldee.app
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ตอบกลับภายใน 2–3 วันทำการ
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-base shrink-0 mt-0.5">🐛</span>
                <div>
                  <p className="font-medium text-gray-800">แจ้งข้อมูลผิดพลาด</p>
                  <p className="text-sm text-gray-600">
                    หากราคาที่แสดงผิดปกติหรือล่าช้าผิดปกติ กรุณาระบุวันเวลาและราคาที่พบ
                  </p>
                </div>
              </div>
            </div>
          </ContentSection>

          {/* ── 9. Ad slot ────────────────────────────────────────────────────── */}
          <AdRectangle />

        </div>
      </Container>
    </div>
  )
}
