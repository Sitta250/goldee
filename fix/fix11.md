# Fix 11 — Clearer Thai copy (intent-driven, not generic finance)

**Phase:** 2 (should build next)  
**Theme:** UX — language matches real questions

## Problem

Copy is sometimes vague or generic; labels don’t match how Thai users think about gold.

## Goal

- Direct, simple phrasing that states **what changed** and **what to do next**.  
- Prefer labels like: `ราคาล่าสุด`, `เปลี่ยนจากเมื่อวาน`, `วิเคราะห์วันนี้`, `คำนวณมูลค่าทอง` (adjust to final tone guide).

## Start here (codebase)

- Grep Thai strings in `components/`, `app/`
- [`components/layout/Header.tsx`](components/layout/Header.tsx), nav
- Hero, analysis, calculator, history headings

## Implementation plan

1. **Spreadsheet or table** (in issue/Notion): old string → new string → location file (optional prep step — or edit in place).
2. **Prioritize** high-traffic strings: home hero, nav, calculator, analysis headings, history timeframe labels.
3. **Replace** vague summaries with concrete nouns (price, baht, บาททอง, ทองคำแท่ง, ทองรูปพรรณ).
4. **Consistency pass**: same concept → same word everywhere (e.g. don’t alternate “อัปเดต” vs “อัพเดท” without a style rule).
5. **i18n**: if `LanguageContext` supports EN, update pairs together or mark Thai-only for v1.

## Dependencies

- Works well after **Fix 10** (so new labels align with metrics).

## Verify

- Native speaker read (if available) on home + calculator + history.
- No leftover English-only strings in Thai-primary surfaces unless intentional.
