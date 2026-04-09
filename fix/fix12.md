# Fix 12 — Stronger source transparency

**Phase:** 2 (should build next)  
**Theme:** Trust — where data comes from

## Problem

Users don’t clearly see that prices trace to YGTA / สมาคมค้าทองคำ, or how delay between source and app works.

## Goal

- Visible attribution, e.g. `อ้างอิงราคาจากสมาคมค้าทองคำ` (exact wording per legal/marketing).  
- `อัปเดตข้อมูลล่าสุดเมื่อ …` tied to real timestamps (**Fix 2**).  
- If ingestion lags source, say so honestly (short line near hero or footer).

## Start here (codebase)

- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`components/layout/Footer.tsx`](components/layout/Footer.tsx)
- [`types/gold.ts`](types/gold.ts) — `source`, `sourceName`
- [`app/history/page.tsx`](app/history/page.tsx) — methodology note pattern

## Implementation plan

1. **Confirm** canonical source name string from DB/API (`sourceName` vs static copy).
2. **Add a compact attribution row** under hero or in header strip (mobile: may wrap; keep one line if possible).
3. **Link** (optional) to official source page if allowed — external `rel="noopener noreferrer"`.
4. **Document lag**: if `fetchedAt` ≫ `capturedAt`, optional microcopy: `ดึงข้อมูลเข้าระบบเมื่อ …` vs `ประกาศจากแหล่งที่มา …`.
5. **Repeat** lightly on calculator page if price is shown there.

## Dependencies

- **Fix 2** for timestamp semantics.

## Verify

- Every price surface shows source + at least one clear time.
- Legal/compliance review if required for attribution text.
