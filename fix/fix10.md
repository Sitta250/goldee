# Fix 10 — Clear labels for market movement (no ambiguous “up/down”)

**Phase:** 2 (should build next)  
**Theme:** Trust — user knows what is being compared

## Problem

Multiple comparisons (previous update vs yesterday vs 7d) can blur into one vague “trend” story.

## Goal

Explicit labels everywhere a delta appears, for example:

- `เปลี่ยนจากรอบก่อน` (or similar) — vs previous snapshot  
- `เปลี่ยนจากเมื่อวาน` — vs prior calendar day baseline (**define in code**)  
- `แนวโน้ม 7 วัน` — only when showing a true 7d metric

Do not mix comparisons in one sentence without naming both baselines.

## Start here (codebase)

- [`lib/utils/trend.ts`](lib/utils/trend.ts) — `calculateChange` and related
- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`components/home/DailySummaryCard.tsx`](components/home/DailySummaryCard.tsx)
- [`types/gold.ts`](types/gold.ts)

## Implementation plan

1. **Inventory** every UI surface that shows a delta or percent; map each to a precise baseline (snapshot N vs N-1, vs daily summary open/close, etc.).
2. **Add Thai labels** as constants in one file (e.g. `lib/utils/copy.ts` or next to components) to avoid drift.
3. **Refactor** hero to show two distinct rows or chips: “vs previous update” and “vs yesterday” with values + direction.
4. **7d trend**: if shown on home, label it explicitly; if not computed, remove or move to history page.
5. **Tooltips** (optional): short explanation on hover for desktop; `aria-label` for screen readers.

## Dependencies

- **Fix 4**, **Fix 19** (single object carrying all deltas).

## Verify

- User testing: “what is this % compared to?” — answer is always on screen.
- No single arrow without a labeled baseline.
