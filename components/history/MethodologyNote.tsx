export function MethodologyNote() {
  return (
    <section
      aria-labelledby="methodology-heading"
      className="rounded-card bg-gray-50 border border-gray-100 px-5 py-5 space-y-3 text-sm text-gray-600"
    >
      <h2 id="methodology-heading" className="font-semibold text-gray-800 text-base">
        วิธีการเก็บข้อมูล
      </h2>
      <ul className="space-y-2 leading-relaxed list-none">
        <li>
          <span className="font-medium text-gray-700">แหล่งข้อมูล — </span>
          ราคาทองอ้างอิงจากสมาคมค้าทองคำแห่งประเทศไทย (YGTA) ที่{' '}
          <span className="font-mono text-xs text-gray-500">goldtraders.or.th/updatepricelist</span>{' '}
          ซึ่งเป็นราคามาตรฐานที่ร้านทองส่วนใหญ่ในไทยใช้อ้างอิง
        </li>
        <li>
          <span className="font-medium text-gray-700">เวลาในตาราง — </span>
          ใช้เวลาประกาศจากแหล่งข้อมูล (
          <span className="font-mono text-xs text-gray-500">capturedAt</span>) เป็นหลัก
          ซึ่งตรงกับเวลาในตารางอัพเดทราคาของ YGTA
          หากไม่มีเวลาประกาศจากแหล่งข้อมูล จะใช้เวลาที่ระบบดึงข้อมูล (
          <span className="font-mono text-xs text-gray-500">fetchedAt</span>) แทน
          เวลาทั้งหมดแสดงในโซนเวลา UTC+7 (ไทย)
        </li>
        <li>
          <span className="font-medium text-gray-700">จำนวนแถวตามช่วงเวลา — </span>
          ตารางแสดงจำนวนแถวที่แตกต่างกันตามช่วงเวลาที่เลือก:
          <ul className="mt-1 ml-4 space-y-0.5 text-gray-500">
            <li>
              <span className="font-medium text-gray-600">7 วัน / 30 วัน — </span>
              แสดงสูงสุด 2 ราคาต่อวัน: ราคาแรกและราคาสุดท้ายของแต่ละวัน
              (ราคาเปิดและราคาปิด) เพื่อให้ดูการเคลื่อนไหวรายวันได้ชัดเจน
            </li>
            <li>
              <span className="font-medium text-gray-600">6 เดือน / 1 ปี — </span>
              แสดง 1 ราคาต่อวัน: เฉพาะราคาสุดท้ายของแต่ละวัน (ราคาปิด)
            </li>
          </ul>
          ราคาทุกแถวเป็นราคาจริงที่บันทึกจากแหล่งข้อมูล ไม่มีการคำนวณหรือประมาณค่า
        </li>
        <li>
          <span className="font-medium text-gray-700">ความถี่ — </span>
          ระบบดึงข้อมูลและบันทึกราคาอัตโนมัติทุก 5 นาทีในวันทำการ
          ราคาที่แสดงอาจมีความล่าช้าสูงสุด 5 นาทีจากราคาจริง
        </li>
        <li>
          <span className="font-medium text-gray-700">หน่วย — </span>
          ราคาทุกรายการแสดงเป็น บาทไทย (THB) ต่อ 1 บาทน้ำหนัก (15.244 กรัม)
          สำหรับทองคำบริสุทธิ์ 96.5%
        </li>
        <li>
          <span className="font-medium text-gray-700">การขจัดข้อมูลซ้ำ — </span>
          หากราคาไม่เปลี่ยนแปลงระหว่างรอบการดึงข้อมูล ระบบจะอัพเดทเวลาล่าสุดเท่านั้น
          ไม่บันทึกแถวข้อมูลซ้ำ เพื่อให้ตารางแสดงเฉพาะการเปลี่ยนแปลงที่แท้จริง
        </li>
        <li>
          <span className="font-medium text-gray-700">กราฟด้านบน — </span>
          กราฟ TradingView แสดงราคาทองคำแท่ง 96.5% ในหน่วยบาทไทย (THB)
          และราคาทองโลก (XAU/USD) ข้อมูลกราฟมาจาก TradingView และอาจแตกต่างจากตารางด้านล่างเล็กน้อย
        </li>
        <li>
          <span className="font-medium text-gray-700">ข้อจำกัด — </span>
          ข้อมูลนี้มีไว้เพื่อการอ้างอิงเท่านั้น ราคาที่ร้านทองจริงอาจแตกต่างเล็กน้อย
          เนื่องจากค่าธรรมเนียมและนโยบายของแต่ละร้าน ไม่ควรใช้เป็นคำแนะนำการลงทุน
        </li>
      </ul>
    </section>
  )
}
