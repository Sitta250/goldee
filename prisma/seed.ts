/**
 * Prisma seed file
 * Run with: npx prisma db seed  OR  npm run db:seed
 *
 * Inserts:
 *   - 1 SiteSettings row
 *   - 1 SourceStatus row
 *   - 5 FaqItems
 *   - 3 Articles
 *   - 1 DailySummary (today)
 *   - 168 GoldPriceSnapshots  (hourly, covering the last 7 days)
 *
 * Prices are deterministic (no Math.random) so the seed is reproducible.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Price generation ─────────────────────────────────────────────────────────
// Produces realistic THB gold bar sell prices for a given hour index.
// hour 0 = 7 days ago, hour 167 = now.

function barSellAtHour(hour: number): number {
  const total     = 168                           // total hours in seed
  const trend     = (hour / total) * 400          // gradual uptrend: +400 over 7 days
  // Intraday cycle: peaks at 14:00, lower at night
  const hourOfDay = hour % 24
  const cycle     = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI) * 100
  // Deterministic noise using trig (no Math.random)
  const noise     = Math.sin(hour * 7.31) * 55 + Math.cos(hour * 3.71) * 35
  return Math.round(47_100 + trend + cycle + noise)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1_000)
}

function today(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ─── Seed data ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database…')

  // ── Clear existing seed/mock data (safe to re-run) ──────────────────────────
  await db.$transaction([
    db.goldPriceSnapshot.deleteMany({ where: { source: { in: ['seed', 'mock'] } } }),
    db.dailySummary.deleteMany({}),
    db.faqItem.deleteMany({}),
    db.article.deleteMany({}),
    db.siteSettings.deleteMany({}),
    db.sourceStatus.deleteMany({}),
  ])

  // ── 1. Site Settings ─────────────────────────────────────────────────────────
  await db.siteSettings.create({
    data: {
      siteName:          'Goldee',
      siteDescription:   'ราคาทองคำวันนี้ ทองคำแท่งและทองรูปพรรณ อัพเดทล่าสุดทุก 5 นาที',
      defaultCurrency:   'THB',
      contactEmail:      'hello@goldee.example.com',
      adBannerText:      '[ AD SLOT — Top Banner 728×90 ]',
      adRectangleText:   '[ AD SLOT — Rectangle 300×250 ]',
      adSidebarText:     '[ AD SLOT — Sidebar 160×600 ]',
      adFooterText:      '[ AD SLOT — Pre-footer 728×90 ]',
      maintenanceMode:   false,
    },
  })
  console.log('  ✓ SiteSettings')

  // ── 2. Source Status ──────────────────────────────────────────────────────────
  await db.sourceStatus.create({
    data: {
      sourceName:          'ygta',
      displayName:         'สมาคมค้าทองคำ (YGTA)',
      status:              'ok',
      lastCheckedAt:       new Date(),
      lastSuccessAt:       new Date(),
      lastSuccessPrice:    47_500,
      consecutiveFailures: 0,
    },
  })
  console.log('  ✓ SourceStatus')

  // ── 3. FAQ Items ──────────────────────────────────────────────────────────────
  const faqItems = [
    {
      question:  'ราคาทองที่แสดงมาจากไหน?',
      answer:    'ราคาทองที่แสดงบนเว็บไซต์นี้อ้างอิงจากราคาประกาศของสมาคมค้าทองคำ (YGTA) ซึ่งเป็นมาตรฐานที่ร้านทองในประเทศไทยส่วนใหญ่ใช้อ้างอิง และอัพเดทอัตโนมัติทุก 5 นาทีในวันทำการ',
      sortOrder: 1,
    },
    {
      question:  '1 บาท (บาทน้ำหนัก) เท่ากับกี่กรัม?',
      answer:    '1 บาทน้ำหนักทอง (ไม่ใช่เงินบาท) เท่ากับ 15.244 กรัม ซึ่งเป็นหน่วยมาตรฐานที่ใช้ในการซื้อขายทองในประเทศไทย',
      sortOrder: 2,
    },
    {
      question:  'ทองคำแท่งกับทองรูปพรรณต่างกันอย่างไร?',
      answer:    'ทองคำแท่งมีความบริสุทธิ์ 96.5% และไม่มีค่ากำเหน็จ เหมาะสำหรับการเก็บออมหรือลงทุน ส่วนทองรูปพรรณ (เครื่องประดับ) มีค่ากำเหน็จและอาจมีความบริสุทธิ์ต่ำกว่า ราคารับซื้อจึงต่ำกว่าทองแท่ง',
      sortOrder: 3,
    },
    {
      question:  'ทำไมราคาซื้อกับราคาขายถึงต่างกัน?',
      answer:    'ส่วนต่างระหว่างราคาซื้อและขาย (Spread) คือค่าบริการและกำไรของร้านทอง โดยทั่วไปทองคำแท่งมีส่วนต่างน้อยกว่าทองรูปพรรณ เพราะทองรูปพรรณมีค่ากำเหน็จรวมอยู่ด้วย',
      sortOrder: 4,
    },
    {
      question:  'เครื่องคิดเลขทองคำนวณอย่างไร?',
      answer:    'สูตรคำนวณ: มูลค่า = น้ำหนัก (บาท) × (ความบริสุทธิ์ ÷ 96.5) × ราคาต่อบาท เช่น ทองแท่ง 96.5% น้ำหนัก 2 บาท ราคาขาย 47,500 บาท/บาท = มูลค่า 95,000 บาท ผลลัพธ์เป็นค่าประมาณ ราคาจริงอาจแตกต่างตามร้านค้า',
      sortOrder: 5,
    },
  ]

  await db.faqItem.createMany({ data: faqItems })
  console.log(`  ✓ FaqItems (${faqItems.length})`)

  // ── 4. Articles ───────────────────────────────────────────────────────────────

  const articles = [
    // ── Article 1: Guide ───────────────────────────────────────────────────────
    {
      slug:       'gold-buying-guide-beginners',
      titleTh:    'ซื้อทองครั้งแรก ต้องรู้อะไรบ้าง?',
      titleEn:    'First-Time Gold Buyer\'s Guide',
      summaryTh:  'คู่มือสำหรับผู้เริ่มต้นซื้อทองคำในประเทศไทย ตั้งแต่ความแตกต่างระหว่างทองแท่งและทองรูปพรรณ ไปจนถึงข้อควรระวังที่มักถูกมองข้าม',
      bodyTh: `## ซื้อทองครั้งแรก เริ่มจากตรงไหน?

การซื้อทองครั้งแรกอาจดูน่ากังวล แต่จริงๆ แล้วมีหลักการไม่กี่ข้อที่ต้องเข้าใจ บทความนี้จะพาคุณไปรู้จักกับโลกของทองคำแบบเข้าใจง่าย

## ทองแท่ง vs ทองรูปพรรณ

### ทองคำแท่ง (Gold Bar)
- ความบริสุทธิ์ **96.5%** — มาตรฐานสากลสำหรับตลาดไทย
- **ไม่มีค่ากำเหน็จ** (ค่าแรงผลิต) — ราคาใกล้เคียงต้นทุนจริง
- ส่วนต่างราคาซื้อ-ขายน้อยกว่า เหมาะกับการ**ลงทุนและเก็บออม**
- รูปแบบ: แผ่นแท่ง น้ำหนักตั้งแต่ 1 สลึง ถึง 10 บาท

### ทองรูปพรรณ (Gold Jewelry)
- มีค่ากำเหน็จ (ค่าแรง + ออกแบบ) รวมอยู่ในราคาขาย
- ราคารับซื้อคืน**ต่ำกว่า**ทองแท่ง เพราะหักค่ากำเหน็จออก
- เหมาะกับการ**ใช้งานสวมใส่** มากกว่าการลงทุน
- หากซื้อเพื่อออม ควรเลือกทองแท่งจะคุ้มกว่า

## หน่วยน้ำหนักที่ต้องรู้

| หน่วย | เท่ากับ |
|-------|---------|
| 1 บาท | 15.244 กรัม |
| 1 สลึง | 3.811 กรัม (= ¼ บาท) |
| 1 กรัม | ≈ 0.0656 บาท |

## ราคาซื้อ vs ราคาขาย

ราคาที่ประกาศมี **2 ราคา** เสมอ:

- **ราคาขาย (ขายออก)** — คือราคาที่คุณ*จ่าย*เมื่อซื้อทองจากร้าน
- **ราคารับซื้อ (รับซื้อ)** — คือราคาที่คุณ*ได้รับ*เมื่อนำทองไปขายคืน

ส่วนต่างระหว่างสองราคานี้คือ "spread" ซึ่งเป็นรายได้ของร้านทอง โดยทั่วไปอยู่ที่ **100 บาท** สำหรับทองแท่ง

## ขั้นตอนการซื้อทองจากร้าน

1. **ตรวจสอบราคาวันนี้** ก่อนออกจากบ้าน (ใช้เว็บไซต์ YGTA หรือ Goldee)
2. **เลือกน้ำหนัก** ที่ต้องการ — สำหรับมือใหม่แนะนำ 1–2 บาทก่อน
3. **ขอใบรับประกัน** (ใบกำกับทอง) ทุกครั้ง — สำคัญมากเวลาขายคืน
4. **เก็บใบกำกับ** ไว้ในที่ปลอดภัย อย่าทิ้ง

## ข้อควรระวัง

- ห้ามซื้อทองจากแหล่งที่ไม่น่าเชื่อถือ — ราคาถูกผิดปกติมักมีกลโกง
- ราคาทองออนไลน์เป็นราคาอ้างอิง ราคาจริง ณ ร้านอาจต่างเล็กน้อย
- ทองรูปพรรณที่ซื้อมาหากนำไปขายร้านอื่น อาจถูกหักค่ากำเหน็จเพิ่ม

## สรุป

สำหรับการลงทุนหรือออมเงิน เลือก**ทองคำแท่ง** เพราะส่วนต่างน้อยกว่าและไม่มีค่ากำเหน็จ สำหรับการสวมใส่ เลือก**ทองรูปพรรณ** ตามความชอบ แต่รู้ไว้ว่าราคาขายคืนจะต่ำกว่าราคาที่ซื้อมา
`,
      coverImageUrl:null,
      category:    'guide',
      isPublished: true,
      publishedAt: new Date('2025-03-20T08:00:00Z'),
    },

    // ── Article 2: Explainer ───────────────────────────────────────────────────
    {
      slug:       'why-gold-price-changes',
      titleTh:    'ราคาทองขึ้นลงเพราะอะไร? อธิบายแบบเข้าใจง่าย',
      titleEn:    'Why Does the Gold Price Go Up and Down?',
      summaryTh:  'เจาะลึกปัจจัยที่ขับเคลื่อนราคาทองคำ ตั้งแต่ค่าเงินดอลลาร์ อัตราดอกเบี้ย ไปจนถึงความต้องการทองจากธนาคารกลางทั่วโลก',
      bodyTh: `## ทำไมราคาทองถึงเปลี่ยนแปลงทุกวัน?

คนส่วนใหญ่รู้ว่าราคาทองขึ้นลง แต่น้อยคนที่เข้าใจว่า*ทำไม* บทความนี้อธิบายปัจจัยหลัก 4 ข้อแบบไม่มีศัพท์เทคนิค

## 1. ค่าเงินดอลลาร์สหรัฐ

ทองคำถูกกำหนดราคาเป็น **USD** ในตลาดโลก ดังนั้น:

- ดอลลาร์**แข็งขึ้น** → ทองแพงขึ้นสำหรับผู้ซื้อสกุลเงินอื่น → ความต้องการลด → ราคาทองลง
- ดอลลาร์**อ่อนลง** → ทองถูกลงในสายตาผู้ซื้อต่างประเทศ → ความต้องการเพิ่ม → ราคาทองขึ้น

สำหรับไทย ราคายังขึ้นกับ **อัตราแลกเปลี่ยนบาท/ดอลลาร์** ด้วย ถ้าบาทอ่อน ราคาทองในบาทก็แพงขึ้นโดยอัตโนมัติ

## 2. อัตราดอกเบี้ย

ทองไม่จ่ายดอกเบี้ยหรือเงินปันผล ดังนั้น:

- ดอกเบี้ยสูง → ฝากเงินหรือซื้อพันธบัตรได้ผลตอบแทนดี → ทองน่าดึงดูดน้อยลง → ราคาทองลง
- ดอกเบี้ยต่ำ → ผลตอบแทนอื่นน้อย → ทองน่าลงทุนมากขึ้น → ราคาทองขึ้น

นี่คือสาเหตุที่เวลา Federal Reserve (ธนาคารกลางสหรัฐ) ประกาศลดดอกเบี้ย ราคาทองมักพุ่งขึ้น

## 3. ความไม่แน่นอนและวิกฤต

ทองถูกมองว่าเป็น **"สินทรัพย์ปลอดภัย"** (Safe Haven):

- สงคราม การเมือง เศรษฐกิจถดถอย → นักลงทุนหนีไปถือทอง → ราคาขึ้น
- ตลาดหุ้นดี เศรษฐกิจแข็งแกร่ง → เงินไหลออกจากทองไปสู่สินทรัพย์เสี่ยง → ราคาลง

## 4. ความต้องการจากธนาคารกลาง

ธนาคารกลางของหลายประเทศ (จีน อินเดีย รัสเซีย ฯลฯ) ซื้อทองเพื่อสำรองเงินตรา:

- ถ้าธนาคารกลางซื้อมาก → อุปสงค์เพิ่ม → ราคาขึ้น
- ปี 2024–2025 ธนาคารกลางทั่วโลกซื้อทองมากที่สุดในรอบ 50 ปี

## ราคาทองไทยต่างจากราคาโลกอย่างไร?

ราคาทองไทยที่ประกาศโดย YGTA คำนวณจาก:

\`\`\`
ราคาโลก (USD/oz) ÷ 32.1507 (oz ต่อกก.) × น้ำหนักบาท × อัตราแลกเปลี่ยน + ส่วนต่าง
\`\`\`

ดังนั้นราคาทองไทยจึงเคลื่อนไหวตามทั้งตลาดโลกและค่าเงินบาทพร้อมกัน

## สรุปในประโยคเดียว

ราคาทองขึ้นเมื่อ **โลกไม่ปลอดภัย ดอลลาร์อ่อน และดอกเบี้ยต่ำ** และลงเมื่อสิ่งเหล่านี้กลับกัน
`,
      coverImageUrl:null,
      category:    'explainer',
      isPublished: true,
      publishedAt: new Date('2025-03-25T08:00:00Z'),
    },

    // ── Article 3: News ────────────────────────────────────────────────────────
    {
      slug:       'gold-market-march-2025',
      titleTh:    'สรุปตลาดทองไทยเดือนมีนาคม 2568: ราคาแตะระดับสูงสุดในรอบปี',
      titleEn:    'Thai Gold Market Summary: March 2025',
      summaryTh:  'ราคาทองคำแท่งในประเทศไทยพุ่งสูงสุดในรอบปีระหว่างเดือนมีนาคม 2568 หลังดัชนีดอลลาร์อ่อนค่าและความต้องการจากธนาคารกลางเพิ่มขึ้นต่อเนื่อง',
      bodyTh: `## ภาพรวมตลาดทองไทยเดือนมีนาคม 2568

ราคาทองคำแท่ง 96.5% ในประเทศไทยเดือนมีนาคม 2568 ปรับตัวขึ้นอย่างต่อเนื่อง สะท้อนแนวโน้มราคาทองในตลาดโลกที่แข็งแกร่ง

## ข้อมูลสำคัญประจำเดือน

| รายการ | ราคา (บาท) |
|--------|-----------|
| ราคาสูงสุดของเดือน (แท่ง ขาย) | 47,600 |
| ราคาต่ำสุดของเดือน (แท่ง ขาย) | 46,800 |
| ราคาเปิดต้นเดือน | 46,900 |
| ราคาปิดสิ้นเดือน | 47,500 |
| การเปลี่ยนแปลง | **+600 บาท (+1.28%)** |

## ปัจจัยขับเคลื่อน

### ดอลลาร์อ่อนค่า
ดัชนีดอลลาร์ (DXY) ปรับตัวลงกว่า 2% ในเดือนมีนาคม หลัง Fed ส่งสัญญาณอาจลดดอกเบี้ยในช่วงกลางปี 2568 ส่งผลให้ทองคำในสกุลเงินอื่นๆ รวมถึงบาทปรับขึ้นตาม

### ความต้องการจากธนาคารกลาง
สภาทองคำโลก (WGC) รายงานว่าธนาคารกลางจีนและอินเดียยังคงซื้อทองต่อเนื่อง ช่วยพยุงราคาในช่วงที่ตลาดผันผวน

### ความไม่แน่นอนทางภูมิรัฐศาสตร์
สถานการณ์ความไม่สงบในตะวันออกกลางและยุโรปตะวันออก ทำให้นักลงทุนทั่วโลกหันมาถือครองทองคำในฐานะสินทรัพย์ปลอดภัย

## แนวโน้มไตรมาส 2/2568

นักวิเคราะห์ส่วนใหญ่ยังมีมุมมองเป็นบวกต่อราคาทองในระยะกลาง โดยมีปัจจัยสนับสนุน:

- คาดการณ์การปรับลดดอกเบี้ยของ Fed ภายในปี 2568
- ความต้องการทองจากธนาคารกลางที่ยังแข็งแกร่ง
- เงินบาทที่อาจอ่อนค่าตามความผันผวนของเศรษฐกิจโลก

> **หมายเหตุ:** ข้อมูลในบทความนี้มีวัตถุประสงค์เพื่อให้ข้อมูลทั่วไปเท่านั้น ไม่ถือเป็นคำแนะนำการลงทุน
`,
      coverImageUrl:null,
      category:    'news',
      isPublished: true,
      publishedAt: new Date('2025-03-31T08:00:00Z'),
    },
  ]

  for (const article of articles) {
    await db.article.create({ data: article })
  }
  console.log(`  ✓ Articles (${articles.length})`)

  // ── 5. Daily Summary (today) ──────────────────────────────────────────────────
  await db.dailySummary.create({
    data: {
      date:        today(),
      titleTh:     'ราคาทองปรับขึ้น 100 บาท หลังดอลลาร์อ่อนค่า',
      summaryTh:   'วันนี้ราคาทองคำแท่งปรับตัวขึ้น 100 บาท จาก 47,400 บาท มาที่ 47,500 บาทต่อบาทน้ำหนัก แรงซื้อมาจากนักลงทุนที่กังวลเรื่องเศรษฐกิจสหรัฐหลังตัวเลข GDP ต่ำกว่าคาด ทำให้ดอลลาร์อ่อนค่าและเงินไหลเข้าสู่ทองคำ',
      reasonTh:    'ดัชนีดอลลาร์ (DXY) ลดลง 0.4% หลังตัวเลข GDP สหรัฐไตรมาส 1/2568 ต่ำกว่าที่นักวิเคราะห์คาดการณ์ไว้ ส่งผลให้ราคาทองโลกปรับตัวขึ้นทะลุ 2,300 USD/oz',
      openBarSell:  47_400,
      closeBarSell: 47_500,
      highBarSell:  47_550,
      lowBarSell:   47_350,
    },
  })
  console.log('  ✓ DailySummary')

  // ── 6. Gold Price Snapshots (168 hours = 7 days, hourly) ──────────────────────
  const snapshots = []

  for (let h = 167; h >= 0; h--) {
    const fetchedAt   = hoursAgo(h)
    const capturedAt  = new Date(fetchedAt.getTime() - 60_000) // 1 min before fetch
    const barSell     = barSellAtHour(167 - h)
    const barBuy      = barSell - 100
    const jewelrySell = barSell + 593   // typical making-charge markup
    const jewelryBuy  = barSell - 800   // jewelry buy-back discount
    const hourIndex   = 167 - h
    // Spot gold: base 2285 USD/oz with gentle curve
    const spotUsd     = 2285 + Math.round(Math.sin(hourIndex * 0.08) * 25)
    // USD/THB: base 33.45 with slow drift
    const usdThb      = parseFloat((33.45 + Math.sin(hourIndex * 0.05) * 0.15).toFixed(4))
    // Announcement number: 68/NNNN (one per hour, starting from 68/0001)
    const annNum      = `68/${String(hourIndex + 1).padStart(4, '0')}`

    snapshots.push({
      fetchedAt,
      capturedAt,
      source:             'seed',
      sourceName:         'Seed Data (สมาคมค้าทองคำ)',
      announcementNumber: annNum,
      goldBarBuy:         barBuy,
      goldBarSell:        barSell,
      jewelryBuy,
      jewelrySell,
      spotGoldUsd:        spotUsd,
      usdThb,
    })
  }

  // createMany is faster than looped creates
  await db.goldPriceSnapshot.createMany({ data: snapshots })
  console.log(`  ✓ GoldPriceSnapshots (${snapshots.length})`)

  console.log('\n✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
