# Fix 13 — Guardrails for AI content (no invention, honest confidence)

**Phase:** 2 (should build next)  
**Theme:** Trust — AI is assistive, not oracular

## Problem

AI might invent causes or sound overly certain without evidence.

## Goal

- Summaries grounded in: price movement, market inputs, trusted news inputs (whatever the pipeline actually provides).  
- If confidence is low or inputs thin, state that cleanly in Thai.  
- Avoid dramatic or fake-certainty phrasing.

## Start here (codebase)

- [`lib/analysis/summarize-gemini.ts`](lib/analysis/summarize-gemini.ts)
- [`lib/analysis/validate-output.ts`](lib/analysis/validate-output.ts)
- [`lib/analysis/fetch-expert-commentary.ts`](lib/analysis/fetch-expert-commentary.ts), [`lib/analysis/fetch-global-news.ts`](lib/analysis/fetch-global-news.ts) if used
- [`types/analysis.ts`](types/analysis.ts) — add `confidence` or `disclaimer` field if needed

## Implementation plan

1. **Prompt rules**: instruct model to only cite drivers present in the provided bullet list; if list empty, output a constrained “สิ่งที่ต้องจับตา” from price/baht/spot only.
2. **Post-validate**: regex or LLM self-check optional; minimum — length limits, banned phrases list, required sections (**Fix 3**).
3. **Confidence enum**: e.g. `high | medium | low`; render small line under analysis when `low`: `ข้อมูลประกอบจำกัด — ใช้ดุลยพินิจ`.
4. **Strip hallucination patterns**: no specific Fed decision unless in news input with date.
5. **Logging**: on validation failure, log and fall back (**Fix 21**).

## Dependencies

- **Fix 1** (same snapshot), **Fix 3** (format).

## Verify

- Red-team prompts / fixture inputs with empty news → output still useful, no fake headlines.
- Medium/low confidence displays subtle notice.
