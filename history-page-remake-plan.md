# Remake Plan: ประวัติราคา Page (Claude Implementation Guide)

## Objective
Rebuild `/history` so data matches [`https://www.goldtraders.or.th/updatepricelist`](https://www.goldtraders.or.th/updatepricelist) as closely as possible for values and update timestamps, and make the top chart TradingView-only (default Thai gold/THB view).

This plan is written for execution by Claude, step by step, feature by feature.

## Scope Decisions (locked)
- Source selection rule:
  - If existing upstream source already provides equivalent update table quality, keep it.
  - Otherwise use YGTA (`goldtraders.or.th`) as source for history table data.
- Matching strictness: strict values + strict timestamp alignment.
- Top chart behavior: TradingView only, default Thai gold (THB) view.

## Current Reality (important before coding)
- `/history` currently renders server-side from `gold_price_snapshot` via:
  - `app/history/page.tsx`
  - `lib/queries/history.ts`
  - `components/history/*`
- Current scheduler pipeline may ingest from non-YGTA normalized source.
- History queries currently use `fetchedAt` heavily; strict matching needs source-native timestamp (`capturedAt`) as primary where available.

---

## Feature 1: Define canonical history source strategy

### Goal
Make history page deterministic about where data comes from and how to fall back.

### Implementation
1. Add a small source strategy module (or constants) in `lib/history/`:
   - `PRIMARY_HISTORY_SOURCE = "upstream_or_ygta"`
   - `FALLBACK_HISTORY_SOURCE = "ygta"`
2. Implement a runtime check:
   - If current upstream provides table-quality fields needed for strict match (price fields + timestamp + update sequence), use it.
   - Else force YGTA-backed rows for history queries.
3. Keep this strategy scoped to history first (no global pipeline rewrite in this task).

### Files likely touched
- `lib/queries/history.ts`
- optional new: `lib/history/source-strategy.ts`

### Acceptance criteria
- One clear code path decides history source.
- No ambiguous mixed-source behavior in history output.

---

## Feature 2: Timestamp correctness for strict match

### Goal
History table/chart use source-native update timestamp to align with YGTA update list timing.

### Implementation
1. In history query layer, prioritize this timestamp order:
   - `capturedAt` (source time)
   - fallback `fetchedAt` (ingest time) only when missing
2. Ensure all row sorting and range filtering use the chosen canonical timestamp.
3. Normalize timezone rendering for Thai locale in UI (UTC+7 display consistency).
4. Preserve raw stored timestamps; only normalize at query/format layer.

### Files likely touched
- `lib/queries/history.ts`
- `components/history/HistoryTable.tsx`
- `components/history/HistoryChart.tsx` (if chart data labels depend on timestamp field)

### Acceptance criteria
- Latest table row time aligns with source update time pattern.
- No off-by-hours rendering issues in Thai timezone.

---

## Feature 3: Data parity rules (prices must correlate with source)

### Goal
Ensure table values correlate to source rows (gold bar/jewelry buy/sell and sequence where available).

### Implementation
1. Define canonical row shape for history:
   - announcement/update number (if available)
   - bar buy/sell
   - jewelry buy/sell
   - canonical timestamp
2. In query transformation, avoid recomputation that can drift values.
3. Add sanity guards:
   - skip malformed rows
   - keep deterministic sort by canonical timestamp then update sequence.
4. If source has duplicates in short interval, apply stable dedupe only when all value fields and timestamp key are equal.

### Files likely touched
- `lib/queries/history.ts`
- `types` file used by history components (existing or new)

### Acceptance criteria
- History table rows are traceable to source values without transformation drift.
- Deterministic ordering and dedupe behavior.

---

## Feature 4: Top chart = TradingView only (Thai gold default)

### Goal
Remove custom history chart as primary top graph; use TradingView embed only.

### Implementation
1. In `app/history/page.tsx`, replace/remove top custom `HistoryChart` block.
2. Embed/reuse TradingView component in history page top section.
3. Set default symbol/view to Thai gold THB context.
4. Keep chart section responsive and visually aligned with page spacing.

### Files likely touched
- `app/history/page.tsx`
- `components/chart/TradingViewChart.tsx` (only if a reusable prop is needed for history-context default)
- optional new wrapper: `components/history/HistoryTradingViewChart.tsx`

### Acceptance criteria
- Top graph is TradingView only.
- Default view is Thai gold THB.
- No old custom line chart appears above the table/stats.

---

## Feature 5: History table UX refresh for source parity

### Goal
Make table clearly represent source updates and easy to verify against YGTA.

### Implementation
1. Add/confirm columns:
   - Time (Thai format)
   - Update/Announcement number (if available)
   - Gold bar buy/sell
   - Jewelry buy/sell
2. Ensure newest-first ordering.
3. Preserve pagination; ensure page boundaries are stable with deterministic sort keys.
4. Update methodology copy to explicitly state source and timestamp basis.

### Files likely touched
- `components/history/HistoryTable.tsx`
- `components/history/MethodologyNote.tsx`
- `lib/queries/history.ts`

### Acceptance criteria
- User can visually cross-check rows against YGTA table.
- Copy accurately describes source and timestamp semantics.

---

## Feature 6: Correlation consistency across related data on page

### Goal
All data displayed on `/history` must come from the same canonical history dataset.

### Implementation
1. Ensure stats cards (`max/min/change`) are computed from the same filtered dataset as the table range.
2. Ensure any displayed “last updated” on `/history` uses canonical timestamp source.
3. Remove hidden split-brain cases where chart/stats/table are from different timestamp bases.

### Files likely touched
- `lib/queries/history.ts`
- `components/history/StatCards.tsx`
- `app/history/page.tsx`

### Acceptance criteria
- Table, stats, and any metadata agree on same dataset/range/time basis.

---

## Feature 6.5: Timeframe-specific daily aggregation rules (locked)

### Goal
Apply exact aggregation behavior by timeframe for `/history` chart/table data density.

### Locked rules
- `7D` and `30D`:
  - Show exactly **2 prices per day**:
    - first price of the day
    - last price of the day
- `6M` and `1Y`:
  - Show exactly **1 price per day**:
    - closing price of the day (last price of the day)
- `All`:
  - Keep existing behavior unless product asks for a separate rule.

### Implementation
1. In `lib/queries/history.ts`, add a per-timeframe aggregation layer after filtering by range and canonical timestamp.
2. Group rows by Thailand calendar day (UTC+7) using canonical timestamp:
   - canonical timestamp = `capturedAt` if present, else `fetchedAt`.
3. For each grouped day:
   - `7D` / `30D`: pick earliest and latest row of that day.
     - If only one row exists that day, output one row (do not duplicate it twice).
   - `6M` / `1Y`: pick only latest row of that day.
4. Ensure deterministic ordering:
   - inside day: sort by canonical timestamp asc before selecting first/last
   - output list: ascending for chart pipelines, descending for table pipelines (as required by UI)
5. Keep price fields unmodified (no averaging/interpolation).
6. Keep this logic source-agnostic and reusable by both table/stats paths where needed.

### Files likely touched
- `lib/queries/history.ts`
- `components/history/HistoryTable.tsx` (if row labels/notes need adjustment)
- `components/history/MethodologyNote.tsx` (document timeframe aggregation policy)

### Acceptance criteria
- `7D` and `30D`: at most two points per day, representing first + last.
- `6M` and `1Y`: exactly one close point per day when data exists.
- No fabricated prices; all points map to real stored rows.
- Day grouping respects Thai timezone.

---

## Feature 7: Validation + observability for parity checks

### Goal
Make correctness verifiable quickly after deploy.

### Implementation
1. Add lightweight diagnostic logging in history query path (guarded by env flag) for:
   - selected source
   - canonical timestamp field used
   - latest row timestamp and values
2. Add one internal parity-check helper (dev-only) that compares latest row to source fetch payload shape.
3. Keep logs non-sensitive and compact.

### Files likely touched
- `lib/queries/history.ts`
- optional new: `lib/history/parity-check.ts`

### Acceptance criteria
- Engineers can quickly verify whether `/history` is aligned with source without manual deep debugging.

---

## Feature 8: Backward compatibility and rollout safety

### Goal
Avoid breaking existing pages while remaking `/history`.

### Implementation
1. Keep `/api/prices/history` contract unchanged unless required by `/history` rewrite.
2. Do not change homepage or analysis logic in this task.
3. If schema differences are needed, support fallback to old rows that lack optional fields.

### Acceptance criteria
- `/history` improves without regressions in unrelated routes.

---

## Execution Order for Claude (must follow)
1. Implement Feature 1 (source strategy).
2. Implement Feature 2 (timestamp correctness).
3. Implement Feature 3 (data parity mapping).
4. Implement Feature 4 (TradingView-only top chart).
5. Implement Feature 5 (table UX + methodology).
6. Implement Feature 6 (stats/data consistency).
7. Implement Feature 6.5 (timeframe-specific daily aggregation rules).
8. Implement Feature 7 (diagnostics/parity validation).
9. Run verification checklist and report.

---

## Verification Checklist (Claude must run)
- Lint/typecheck passes.
- `/history` loads with TradingView top chart only.
- Table values and top rows time align with YGTA update list pattern.
- Stats match table range data.
- Timeframe aggregation is correct:
  - `7D` / `30D` show first+last per day.
  - `6M` / `1Y` show one daily close per day.
- Pagination stable and deterministic.
- Methodology text reflects actual source + timestamp rules.

## Required Output From Claude
- Changed files list with per-file purpose.
- Any assumptions made for source strategy fallback decision.
- Before/after behavior summary for `/history`.
- Known risks and follow-up recommendations.
