# Today Gold Analysis - Claude Implementation Spec

## 1) Objective

Build a production-safe **Today Gold Analysis** feature with:

- **Model:** `gemini-2.5-flash`
- **Only secret required:** `GEMINI_API_KEY`
- **Languages:** Thai + English with toggle
- **Schedule:** run analysis **twice daily** at `09:30` and `18:00` (UTC+7)
- **Content split:**
  - **Thai section:** recent Thai gold price movement recap
  - **Global section:** major world events + expert commentary affecting gold

---

## 2) Hard Constraints (Must Not Be Violated)

- Never invent prices, dates, sources, experts, or macro events.
- All numeric comparisons are computed in backend code (never by LLM).
- LLM summarizes only backend-curated evidence.
- LLM output must be strict JSON that matches the schema.
- No investment advice (`buy`, `sell`, recommendation language is forbidden).
- Distinguish observed move vs possible drivers.
- Do not claim causation unless sources clearly support it.
- If evidence is weak or conflicting, output conservative language and lower confidence.

---

## 3) Functional Requirements

### 3.1 Data Inputs

1. **Thai price snapshots** (existing ingestion pipeline, continuous).
2. **Global news** (ranked/deduped, recent + relevant).
3. **Expert commentary** (allowlist-only sources, ranked).

### 3.2 Output Requirements

- Persist analysis payload (do not generate live on every page request).
- Show latest valid analysis on homepage.
- Render same payload in Thai or English based on global language toggle.

---

## 4) Implementation Plan

## Phase 1 - Data model + type contracts

- Add/extend storage for:
  - structured analysis payload (JSON)
  - metadata:
    - `generated_at`
    - `based_on_price_timestamp`
    - `based_on_news_window`
    - `model_name`
    - `model_version`
    - `input_hash`
- Update TypeScript types used by query/UI boundary.

## Phase 2 - Deterministic analysis services

Create services under `lib/analysis/`:

- `compute-price-facts.ts`
- `fetch-global-news.ts`
- `rank-news.ts`
- `fetch-expert-commentary.ts`
- `rank-experts.ts`
- `build-input-bundle.ts`

Price facts (computed in code):

- `change_vs_yesterday_abs`
- `change_vs_yesterday_pct`
- `change_vs_7d_abs`
- `change_vs_7d_pct`
- `intraday_range_abs`
- `direction_today` (`up|down|flat`)
- `direction_week` (`up|down|flat`)

Ranking heuristics:

- Boost: recency, reputable source, consensus across sources.
- Penalize: duplicates, low-authority sites, opinion spam.

## Phase 3 - Gemini summarizer + output validation

Create:

- `summarize-gemini.ts`
  - model = `gemini-2.5-flash`
  - reads only `GEMINI_API_KEY`
  - no tool use/browsing/research
  - returns JSON only

- `validate-output.ts`
  - schema validation
  - numeric equality checks vs backend facts
  - source/expert allowlist checks
  - banned advice language checks
  - overconfidence phrase checks

Failure policy:

1. Retry once with stricter instruction.
2. If still invalid, persist safe fallback payload with clear insufficient-evidence messaging.

## Phase 4 - Scheduler integration

- Add dedicated analysis scheduler route.
- Reuse current cron auth/security pattern.
- Schedule two runs daily: `09:30` and `18:00` UTC+7.
- Ensure idempotency per run window.
- Log success/failure with context.

## Phase 5 - Query + homepage wiring

- Add query for latest valid persisted analysis.
- Inject into homepage aggregate query.
- Homepage must always read cached persisted analysis (never block on live LLM call).

## Phase 6 - Global TH/EN UI toggle

- Add `LanguageContext` (parallel to existing `CurrencyContext` pattern).
- Mount provider in root layout.
- Add `LanguageToggle` in header.
- Render primary UI text from TH/EN dictionary map.
- Analysis sections must switch language immediately when toggled.

## Phase 7 - Analysis UI rendering

Render two clear sections:

1. **Thai Gold Today**
   - Short paragraph focused on recent local movement.
2. **Global Drivers**
   - 2-4 bullets for major world events + expert trend.

Always display:

- last updated timestamp
- source count
- transparency label:  
  `AI-generated summary based on aggregated market data and news sources`

## Phase 8 - Testing and quality gates

Add tests for:

- deterministic price math invariants
- schema + guardrail rejection behavior
- language toggle rendering correctness
- scheduler window behavior and latest-result selection

Run lint + typecheck and resolve issues before merge.

---

## 5) Strict JSON Output Schema

```json
{
  "price_analysis": {
    "headline": "string",
    "summary": "string",
    "vs_yesterday": {
      "direction": "up|down|flat",
      "absolute_change": 0,
      "percent_change": 0
    },
    "vs_7d": {
      "direction": "up|down|flat",
      "absolute_change": 0,
      "percent_change": 0
    }
  },
  "market_drivers": [
    {
      "theme": "string",
      "impact_type": "already_affecting|could_affect",
      "summary": "string",
      "confidence": "low|medium|high",
      "source_count": 0
    }
  ],
  "expert_view": {
    "overall_trend": "bullish|bearish|mixed|unclear",
    "summary": "string",
    "consensus_strength": "low|medium|high"
  },
  "disclaimer": "string"
}
```

---

## 6) Prompt Contract for Gemini

### System instructions (required)

- Summarize only provided facts/evidence.
- Never invent values/sources/experts/events.
- No investment advice.
- Conservative language when evidence is mixed.
- Return valid JSON only.

### User prompt constraints (required)

- Use computed numbers exactly as provided.
- `already_affecting` only with direct/strong evidence.
- Otherwise use `could_affect`.
- Length limits:
  - `price_analysis.summary` <= 80 words
  - each `market_drivers[].summary` <= 50 words
  - `expert_view.summary` <= 70 words

---

## 7) Acceptance Criteria (Definition of Done)

- Works with only `GEMINI_API_KEY`.
- Analysis runs twice daily at `09:30` and `18:00` (UTC+7).
- Homepage shows latest valid persisted analysis.
- Thai/English toggle works across primary UI.
- Thai section reflects local recent movement.
- Global section reflects major world events/expert signals.
- No fabricated values/sources/experts appear in output.
- Guardrails block invalid/harmful output before display.

---

## 8) Anti-Patterns (Do Not Implement)

- Live LLM generation on every page request.
- Prompting model for market reasons without evidence bundle.
- Treating random social/blog content as expert sources.
- Mixing Thai retail and global spot without explicit labels.
- Allowing unsupported causal claims.

---

## 9) Minimal Execution Pseudocode

```ts
function buildDailyGoldAnalysis() {
  const priceFacts = computePriceFacts();
  const newsItems = rankAndDedupNews(fetchGlobalNews()).slice(0, 12);
  const expertItems = rankExperts(fetchExpertCommentary()).slice(0, 5);

  const inputBundle = { priceFacts, newsItems, expertItems };
  const llmJson = callGemini(inputBundle, "gemini-2.5-flash");

  const validated = validateOutput(llmJson, priceFacts, newsItems, expertItems);
  return persistAnalysis(validated);
}
```

