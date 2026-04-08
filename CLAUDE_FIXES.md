# Claude Fix List - Gold Analysis Feature

This file lists required fixes after review of the current implementation.
Apply in priority order.

---

## P0 (Blocker) - Build fails due to missing migration

### Problem
- `GoldAnalysis` model was added in Prisma schema, but no migration exists.
- Build fails at prerender `/` because table `gold_analysis` is missing.

### Files
- `prisma/schema.prisma`
- `prisma/migrations/*` (new migration required)

### Required fix
1. Generate and commit Prisma migration for `GoldAnalysis`.
2. Ensure migration SQL creates:
   - table `gold_analysis`
   - indexes matching schema (`generatedAt`, `runWindow + generatedAt`)
3. Verify DB is migrated before build.

### Acceptance check
- `npm run build` completes without Prisma P2021 table-not-found error.

---

## P1 - Query behavior mismatch ("latest valid" vs actual)

### Problem
- `getLatestAnalysis()` comment says latest valid record.
- Implementation fetches latest record regardless of `isValid`.

### File
- `lib/queries/analysis.ts`

### Required fix
- Decide one behavior and make code + comments consistent:
  - **Option A (recommended):** return latest record where `isValid = true`
  - **Option B:** keep latest-any and rename function/comment to reflect that

### Acceptance check
- Function name, comment, and query condition all align with actual behavior.

---

## P1 - Missing source-provenance validation in output guardrails

### Problem
- Validator claims source/allowlist checks but does not enforce them.
- `EXPERT_SOURCE_NAMES` is imported but unused.

### Files
- `lib/analysis/validate-output.ts`
- `lib/analysis/analysis.service.ts` (if function signature needs input references)

### Required fix
1. Add validation that generated content does not cite unknown experts/sources.
2. Compare against provided input bundle (news + expert items) and allowlist where applicable.
3. If mismatch detected, fail validation and trigger retry/fallback path.

### Acceptance check
- Unknown source/expert references are rejected by validator.

---

## P2 - "Global bilingual UI" only partially implemented

### Problem
- Language toggle exists globally, but most UI text remains Thai-only.
- Current bilingual behavior is mainly limited to the new analysis card.

### Files (minimum)
- `components/layout/Header.tsx`
- `app/page.tsx`
- `components/home/*` (main homepage text blocks)
- any shared text-heavy components shown on homepage

### Required fix
1. Implement dictionary-driven TH/EN text for primary UI surfaces.
2. Keep analysis card behavior unchanged (already bilingual).
3. Ensure toggle changes visible page copy, not just one component.

### Acceptance check
- Switching TH/EN changes key homepage + header text consistently.

---

## P2 - Lint workflow is not non-interactive

### Problem
- `npm run lint` prompts ESLint setup interactively.
- CI/local checks cannot run reliably.

### Files
- ESLint config files (add if missing): e.g. `eslint.config.mjs` or `.eslintrc.*`
- `package.json` scripts (if needed)

### Required fix
1. Add/commit project ESLint config for Next.js.
2. Ensure `npm run lint` runs without prompts.

### Acceptance check
- `npm run lint` exits non-interactively with valid result.

---

## Verification checklist for Claude

After fixes:

1. Run `npm run build` (must pass).
2. Run `npm run lint` (must run non-interactively).
3. Confirm homepage can load without missing-table errors.
4. Confirm analysis query behavior matches intended valid/invalid policy.
5. Confirm validator rejects unknown source/expert mentions.
6. Confirm TH/EN toggle updates key UI text beyond analysis card.

---

## Notes

- Do **not** remove fallback behavior; keep safe fallback payload path.
- Keep requirement that only `GEMINI_API_KEY` is required for model access.
- Preserve twice-daily scheduler timing (`09:30` and `18:00` UTC+7).
