/**
 * TH/EN dictionary for primary UI text.
 * Components call useLanguage().lang and index into this map.
 */

export type Lang = 'th' | 'en'

export const UI = {
  nav: {
    home:       { th: 'หน้าแรก',    en: 'Home'        },
    history:    { th: 'ประวัติราคา', en: 'Price History'},
    calculator: { th: 'คำนวณทอง',   en: 'Calculator'  },
    articles:   { th: 'บทความ',      en: 'Articles'    },
    about:      { th: 'เกี่ยวกับ',   en: 'About'       },
  },
  homepage: {
    articlesHeading:  { th: 'บทความล่าสุด',              en: 'Latest Articles'               },
    articlesSubtitle: { th: 'ความรู้และข่าวสารเกี่ยวกับทองคำ', en: 'Gold knowledge and news'   },
    viewAll:          { th: 'ดูทั้งหมด →',               en: 'View all →'                    },
    faqHeading:       { th: 'คำถามที่พบบ่อย',            en: 'FAQ'                           },
    faqEmpty:         { th: 'ยังไม่มีคำถาม-คำตอบในขณะนี้', en: 'No FAQ items yet.'           },
    noPrice:          { th: 'ยังไม่มีข้อมูลราคาทอง',     en: 'No gold price data yet'        },
    noPriceDetail:    {
      th: 'ระบบกำลังเริ่มต้น — ราคาจะปรากฏโดยอัตโนมัติหลังการดึงข้อมูลครั้งแรก (ทุก 5 นาทีในวันทำการ)',
      en: 'System initialising — prices appear automatically after the first data fetch (every 5 min on trading days).',
    },
  },
  dailySummary: {
    heading: { th: 'สรุปราคาทองวันนี้', en: "Today's Gold Summary" },
    open:    { th: 'เปิด',             en: 'Open'                  },
    close:   { th: 'ปิด',              en: 'Close'                 },
    high:    { th: 'สูงสุด',           en: 'High'                  },
    low:     { th: 'ต่ำสุด',           en: 'Low'                   },
  },
} as const

/** Look up a UI string for the active language */
export function s(text: { th: string; en: string }, lang: Lang): string {
  return text[lang]
}
