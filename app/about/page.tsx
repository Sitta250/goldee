import type { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { Divider } from '@/components/ui/Divider'

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา และวิธีคำนวณ',
  description:
    'ข้อมูลเกี่ยวกับ Goldee แหล่งที่มาของข้อมูลราคาทอง วิธีการคำนวณ และข้อกำหนดการใช้งาน',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          เกี่ยวกับ Goldee
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          เว็บไซต์ข้อมูลราคาทองสำหรับคนไทยทุกคน
        </p>

        {/* About */}
        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">เราคือใคร?</h2>
          <p className="text-sm text-gray-700 leading-[1.8]">
            Goldee คือเว็บไซต์ข้อมูลราคาทองคำที่สร้างขึ้นเพื่อให้คนไทยทั่วไปสามารถตรวจสอบราคาทองได้ง่ายและรวดเร็ว
            โดยไม่ต้องมีความรู้ด้านการลงทุนหรือการเงิน เน้นความเรียบง่าย อ่านง่าย และใช้งานได้บนมือถือ
          </p>
        </section>

        <Divider className="mb-8" />

        {/* Data source */}
        <section id="data-source" className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">แหล่งที่มาของข้อมูล</h2>
          <p className="text-sm text-gray-700 leading-[1.8]">
            ราคาทองที่แสดงบนเว็บไซต์นี้อ้างอิงจากราคาประกาศของสมาคมค้าทองคำ (YGTA)
            ซึ่งเป็นมาตรฐานที่ร้านทองในประเทศไทยส่วนใหญ่ใช้อ้างอิง
          </p>
          {/* TODO: Update source name and link when data source is confirmed */}
          <p className="text-xs text-gray-400">
            * ข้อมูลแหล่งที่มาจะอัพเดทเมื่อระบบเชื่อมต่อกับแหล่งข้อมูลจริงแล้ว
          </p>
        </section>

        <Divider className="mb-8" />

        {/* Methodology */}
        <section id="methodology" className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">วิธีคำนวณ</h2>

          <div className="space-y-3 text-sm text-gray-700 leading-[1.8]">
            <h3 className="font-semibold text-gray-800">หน่วยน้ำหนักทอง</h3>
            <p>
              ในประเทศไทยใช้หน่วย <strong>"บาท"</strong> (ไม่ใช่เงินบาท) เป็นหน่วยน้ำหนักมาตรฐาน
              โดย <strong>1 บาท = 15.244 กรัม</strong>
            </p>

            <h3 className="font-semibold text-gray-800">ความบริสุทธิ์</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>ทองคำแท่ง:</strong> ความบริสุทธิ์ 96.5% (มาตรฐาน YGTA)</li>
              <li><strong>ทองรูปพรรณ:</strong> ความบริสุทธิ์อาจต่ำกว่า ขึ้นกับชิ้นงาน</li>
              <li><strong>ทอง 18K:</strong> ประมาณ 75% หรือ 18/24 ส่วน</li>
            </ul>

            <h3 className="font-semibold text-gray-800">สูตรคำนวณมูลค่า</h3>
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 font-mono text-xs text-gray-700">
              มูลค่า (บาท) = น้ำหนัก (บาท) × (ความบริสุทธิ์ ÷ 96.5) × ราคาต่อบาท
            </div>

            <h3 className="font-semibold text-gray-800">ค่ากำเหน็จ</h3>
            <p>
              ราคาทองรูปพรรณจะรวมค่ากำเหน็จ (ค่าแรงและค่าออกแบบ) ไว้ในราคาขายแล้ว
              ซึ่งทำให้ราคาขายสูงกว่าทองแท่ง และราคารับซื้อคืนต่ำกว่า
            </p>
          </div>
        </section>

        <Divider className="mb-8" />

        {/* Update frequency */}
        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">ความถี่ในการอัพเดท</h2>
          <p className="text-sm text-gray-700 leading-[1.8]">
            ระบบดึงข้อมูลราคาทองอัตโนมัติทุก <strong>5 นาที</strong> ในวันทำการ
            ราคาที่แสดงอาจมีความล่าช้าไม่เกิน 5–10 นาทีจากราคาตลาดจริง
            ในวันหยุดราชการและวันหยุดสุดสัปดาห์ ราคาจะแสดงราคาปิดล่าสุด
          </p>
        </section>

        <Divider className="mb-8" />

        {/* Disclaimer */}
        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">ข้อจำกัดความรับผิดชอบ</h2>
          <div className="rounded-card bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 leading-[1.8]">
            <p>
              ข้อมูลและราคาทองที่แสดงบนเว็บไซต์นี้มีวัตถุประสงค์เพื่อเป็นข้อมูลทั่วไปเท่านั้น
              ไม่ถือเป็นคำแนะนำทางการเงิน การลงทุน หรือคำแนะนำในการซื้อขาย
              ราคาที่แสดงอาจแตกต่างจากราคาจริง ณ จุดซื้อขาย
              Goldee ไม่รับผิดชอบต่อความเสียหายใดๆ อันเกิดจากการนำข้อมูลนี้ไปใช้
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">ติดต่อเรา</h2>
          <p className="text-sm text-gray-700">
            {/* TODO: Add real contact information */}
            หากพบข้อมูลผิดพลาดหรือต้องการติดต่อทีมงาน กรุณาส่งอีเมลมาที่:{' '}
            <a
              href="mailto:hello@goldee.example.com"
              className="text-gold-600 hover:underline"
            >
              hello@goldee.example.com
            </a>
          </p>
        </section>
      </Container>
    </div>
  )
}
