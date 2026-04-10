/**
 * Canonical Thai/English labels for every price delta surface in the UI.
 *
 * Keep all wording here so that label drift across components is impossible.
 * Each constant names the exact baseline being compared against, answering
 * the user question "compared to WHAT?".
 */

export const DELTA_LABELS = {
  /** Change from the immediately preceding 5-min snapshot */
  vsPrevious: {
    th: 'เปลี่ยนจากรอบก่อน',
    en: 'vs previous update',
  },
  /** Change from yesterday's last recorded price (UTC+7 midnight baseline) */
  vsYesterday: {
    th: 'เปลี่ยนจากเมื่อวาน',
    en: 'vs yesterday',
  },
  /** 7-day price trend (latest vs 7 days ago) */
  vs7d: {
    th: 'แนวโน้ม 7 วัน',
    en: '7-day trend',
  },
} as const
