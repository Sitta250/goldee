# Fix 3 — Rewrite AI rationale block (rigid Thai format)

**Phase:** 1 (must fix now)  
**Theme:** Differentiation — AI must feel specific, not generic

## Problem

Current AI text feels generic and sometimes disconnected from on-screen numbers. Filler like “ไม่มีข่าวล่าสุด” hurts usefulness.

## Goal

Structured output in this shape (short, data-grounded):

```txt
สถานะวันนี้: ขึ้น / ลง / ทรงตัว

เหตุผลหลัก:
- ...
- ...

สิ่งที่ต้องจับตา:
- ...
- ...

มุมมองวันนี้:
- เหมาะกับคนซื้อ / คนขาย / คนรอ
```

- Tied to **real** movement and snapshot data.
- No filler unless genuinely the best answer and still actionable.

## Start here (codebase)

- [`lib/analysis/summarize-gemini.ts`](lib/analysis/summarize-gemini.ts) — prompts / parsing
- [`lib/analysis/validate-output.ts`](lib/analysis/validate-output.ts)
- [`lib/analysis/analysis.service.ts`](lib/analysis/analysis.service.ts)
- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx)
- [`types/analysis.ts`](types/analysis.ts)

## Implementation plan

1. **Update the LLM system/user prompt** to require exactly the sections above (Thai headings as specified). Forbid extra preamble and vague finance boilerplate.
2. **Pass structured inputs** into the prompt: today’s bar sell/buy, change vs previous snapshot, optional summary stats, and news snippets — so the model must ground bullets in those inputs (see **Fix 13** for guardrails).
3. **Parse or render**: either request JSON with fixed keys and map to the template, or validate markdown/sections in `validate-output.ts` and reject/regenerate on failure.
4. **Update `GoldAnalysisCard`** to render the sections with clear typography (headings + lists), matching the rigid format.
5. **Remove or narrow filler**: replace “no news” with a single useful line (e.g. focus on domestic round + baht) only when inputs truly lack news.

## Dependencies

- **Fix 1** — analysis must reference the same snapshot as the hero.
- **Fix 13** — confidence / no-invention rules.

## Verify

- Generated analysis always contains all four blocks with non-empty substantive lines when data exists.
- Visual check: numbers mentioned in AI match hero for the same load.
