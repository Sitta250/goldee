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
          ราคาทองอ้างอิงจากสมาคมค้าทองคำแห่งประเทศไทย (YGTA) ซึ่งเป็นราคามาตรฐาน
          ที่ร้านทองส่วนใหญ่ในไทยใช้อ้างอิง
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
          ไม่บันทึกแถวข้อมูลซ้ำ เพื่อให้กราฟแสดงการเปลี่ยนแปลงที่แท้จริง
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
