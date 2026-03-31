// FAQ uses native <details>/<summary> — no JS required.
// Content is static and can be updated here or loaded from CMS later.

const FAQ_ITEMS = [
  {
    question: 'ราคาทองที่แสดงมาจากไหน?',
    answer:
      'ราคาทองที่แสดงบนเว็บไซต์นี้อ้างอิงจากราคามาตรฐานของสมาคมค้าทองคำ (YGTA) และอัพเดทอัตโนมัติทุก 5 นาทีในวันทำการ',
  },
  {
    question: '1 บาท (บาทน้ำหนัก) เท่ากับกี่กรัม?',
    answer:
      '1 บาทน้ำหนักทอง (ไม่ใช่เงินบาท) เท่ากับ 15.244 กรัม ซึ่งเป็นหน่วยมาตรฐานที่ใช้ในการซื้อขายทองในประเทศไทย',
  },
  {
    question: 'ทองคำแท่งกับทองรูปพรรณต่างกันอย่างไร?',
    answer:
      'ทองคำแท่งมีความบริสุทธิ์ 96.5% และไม่มีค่ากำเหน็จ เหมาะสำหรับการเก็บออมหรือลงทุน ส่วนทองรูปพรรณ (เครื่องประดับ) มีค่ากำเหน็จและอาจมีความบริสุทธิ์ต่ำกว่า ราคารับซื้อจึงต่ำกว่าทองแท่ง',
  },
  {
    question: 'ทำไมราคาซื้อกับราคาขายถึงต่างกัน?',
    answer:
      'ส่วนต่างระหว่างราคาซื้อและขาย (Spread) คือค่าบริการและกำไรของร้านทอง โดยทั่วไปทองคำแท่งมีส่วนต่างน้อยกว่าทองรูปพรรณ เพราะทองรูปพรรณมีค่ากำเหน็จรวมอยู่ด้วย',
  },
  {
    question: 'ราคาทองอัพเดทกี่นาทีครั้ง?',
    answer:
      'ระบบดึงข้อมูลราคาทองอัตโนมัติทุก 5 นาที ในวันทำการตามเวลาทำการของตลาด อาจมีความล่าช้าเล็กน้อยจากการประมวลผล',
  },
  {
    question: 'ข้อมูลนี้ใช้ตัดสินใจซื้อขายได้เลยไหม?',
    answer:
      'ข้อมูลบนเว็บไซต์นี้มีวัตถุประสงค์เพื่อเป็นข้อมูลอ้างอิงทั่วไปเท่านั้น ไม่ถือเป็นคำแนะนำทางการเงิน ควรตรวจสอบราคาจากร้านทองโดยตรงก่อนทำธุรกรรม',
  },
  {
    question: 'เครื่องคิดเลขทองคำนวณอย่างไร?',
    answer:
      'สูตรคำนวณ: มูลค่า = น้ำหนัก (บาท) × (ความบริสุทธิ์ / 96.5) × ราคาต่อบาท เช่น ทองแท่ง 96.5% น้ำหนัก 2 บาท คูณด้วยราคาขายต่อบาท = มูลค่าโดยประมาณ',
  },
]

export function FaqSection() {
  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <h2 id="faq-heading" className="text-xl font-semibold text-gray-900">
        คำถามที่พบบ่อย
      </h2>

      <dl className="space-y-2">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={i}
            className="group rounded-card bg-white border border-gray-100 shadow-card overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none text-gray-900 font-medium text-sm hover:bg-gray-50 transition-colors">
              <dt>{item.question}</dt>
              <span
                className="shrink-0 text-gray-400 group-open:rotate-180 transition-transform duration-200"
                aria-hidden="true"
              >
                ▾
              </span>
            </summary>
            <dd className="px-5 pb-4 pt-0 text-sm text-gray-600 leading-[1.8] border-t border-gray-50">
              {item.answer}
            </dd>
          </details>
        ))}
      </dl>
    </section>
  )
}
