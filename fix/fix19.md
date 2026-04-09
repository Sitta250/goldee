# Fix 19 — One shared pricing model (typed, UI-agnostic)

**Phase:** 2 / engineering foundation for Phase 1  
**Theme:** Engineering — single object for all price UI

## Problem

Components infer different shapes from raw snapshots; deltas duplicate logic.

## Goal

One typed structure (adapt names to existing `GoldPriceSnapshot` / DB — extend, don’t fight Prisma types unnecessarily):

```ts
// Target shape (conceptual — align with prisma + app naming)
type DisplayGoldPrice = {
  sourceName: string
  sourceUpdatedAt: string  // ISO or display-ready with timezone rule
  appUpdatedAt: string
  buyPrice: number        // define: bar buy vs jewelry — may need nested bar/jewelry
  sellPrice: number
  changeFromPreviousUpdate: number
  changeFromYesterday: number
  change7d: number
}
```

Every consumer reads this **view model**, not ad-hoc `findFirst` in components.

## Start here (codebase)

- [`types/gold.ts`](types/gold.ts)
- [`lib/queries/prices.ts`](lib/queries/prices.ts)
- [`lib/utils/trend.ts`](lib/utils/trend.ts)
- [`lib/queries/homepage.ts`](lib/queries/homepage.ts) — assemble view model once

## Implementation plan

1. **Define** `DisplayGoldPrice` (or extend existing types) with explicit fields for bar vs jewelry if both show on home.
2. **Add mapper** `toDisplayGoldPrice(snapshot, previous, yesterdayRow, stats7d)` in one module; unit test edge cases (null yesterday).
3. **Refactor** `PriceHero`, calculator preview, and any header currency uses to accept `DisplayGoldPrice` or a slimmer pick type.
4. **Deprecate** duplicate delta math in components; import from mapper only.
5. **Document** field meanings in TSDoc for designers/engineers.

## Dependencies

- Do **before or with** **Fix 1**, **Fix 4**, **Fix 10**, **Fix 20**.

## Verify

- Grep: no `goldBarSell` raw access in UI except inside mapper tests/mapper file.
- Typecheck passes; homepage unchanged visually except labels from other fixes.
