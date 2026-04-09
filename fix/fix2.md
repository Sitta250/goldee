# Fix 2 — Update-time trust (last updated, source time, refresh honesty)

**Phase:** 1 (must fix now)  
**Theme:** Trust — copy must match behavior

## Problem

The site claims prices update every 5 minutes but timestamps can look stale or inconsistent. Users cannot tell **when the source** updated vs **when the app** ingested data.

## Goal

- Show clearly:
  - **Last updated (app)** — when Goldee last stored/refreshed this snapshot.
  - **Source updated at** — when the upstream (e.g. YGTA) published the price, if available (`capturedAt` / source fields).
  - **Next refresh** (optional) — only if you actually schedule client/server refresh on that cadence; otherwise omit or soften copy.
- Never imply “live” or strict 5-minute freshness unless ingestion and UI reflect it.

## Start here (codebase)

- [`components/price/LastUpdated.tsx`](components/price/LastUpdated.tsx)
- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`types/gold.ts`](types/gold.ts) — `fetchedAt`, `lastSeenAt`, `capturedAt`
- [`lib/queries/prices.ts`](lib/queries/prices.ts)
- [`app/layout.tsx`](app/layout.tsx) — if layout fetches snapshot for currency
- Copy in [`app/page.tsx`](app/page.tsx) metadata / marketing strings if they mention “every 5 minutes”

## Implementation plan

1. **Inventory fields** available on `GoldPriceSnapshot` and document semantic meaning for each timestamp in one comment or small doc block in `types/gold.ts`.
2. **UI contract**: pick labels in Thai + English context (e.g. `อัปเดตในระบบ`, `เวลาประกาศจากแหล่งที่มา`) and use them consistently in `LastUpdated` and hero area.
3. **Align marketing copy** with cron/ISR: if `revalidate` is 300s but source only moves 1–2×/day, adjust footer/hero microcopy so it’s not misleading.
4. **Optional “next refresh”**: only add if you have a real timer (e.g. client poll or visible server revalidation); otherwise remove claims of fixed cadence from visible text.
5. **Calculator / other pages**: reuse the same `LastUpdated` component and same timestamp rules.

## Dependencies

- Overlaps **Fix 12** (source transparency) — implement UI labels here; legal/source attribution detail can live there.

## Verify

- Compare DB `capturedAt` vs `fetchedAt` on a real row; UI shows both meanings without contradicting “5 minutes” messaging.
- No page claims automatic refresh unless something actually refreshes on that schedule.
