### Fix: Daily 10:45 Analysis & InterGold Expert Source

**Status**: Not started  
**Owner**: Claude / implementation agent  
**Goal**: Run the Gemini “Today Gold Analysis” once per day around **10:45 Asia/Bangkok**, with a GitHub backup trigger, and include **InterGold’s daily Thai analysis** as an expert commentary source.

Domain to assume for examples: `https://goldee-five.vercel.app`

---

### 0. Where to start

- Read these files first:
  - `vercel.json` — current crons for `/api/scheduler/analysis`
  - `.github/workflows/scheduler-analysis.yml` — backup cron via GitHub Actions
  - `lib/analysis/fetch-expert-commentary.ts` — expert commentary sources
  - `lib/analysis/analysis.service.ts` — orchestrator (`runGoldAnalysis`)
  - `lib/analysis/summarize-gemini.ts` — how news + experts feed the LLM
  - `README.md` — Step 7/8 scheduler docs (gold polling + analysis)

---

### 1. Change Vercel cron to a single 10:45 ICT run

**File**: `vercel.json`

1. Locate the `"crons"` array. It currently has multiple entries for `/api/scheduler/analysis` (morning + evening, plus retries).
2. Replace the entire `"crons"` array with **one** job:

```jsonc
{
  "crons": [
    {
      "path": "/api/scheduler/analysis",
      "schedule": "45 3 * * *"
    }
  ],
  "headers": [
    // keep existing headers block AS IS
  ]
}
```

- `45 3 * * *` is **03:45 UTC**, which is approximately **10:45 Asia/Bangkok**.
- This still respects Vercel Hobby’s rule: each cron expression must run **at most once per day**.

3. After pushing this change, the user will redeploy on Vercel. You don’t need to call Vercel from here, just make sure the JSON is valid.

**Sanity check (local)**:

- Run:

```bash
npm run build
```

- Build must pass with no new errors.

---

### 2. Update comments / docs to match the new cadence

#### 2.1 Cron route comment

**File**: `app/api/scheduler/analysis/route.ts`

1. At the top there’s a block comment that currently mentions “09:30 and 18:00 ICT” or “morning + evening”.
2. Update the wording to reflect **one daily run at ~10:45 ICT**. Example:

```ts
/**
 * GET /api/scheduler/analysis
 *
 * Cron-triggered endpoint for the Today Gold Analysis.
 * Runs once per day around 10:45 Asia/Bangkok (03:45 UTC).
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 */
```

3. Do not change any behavior of the handler — only the docs.

#### 2.2 README scheduling docs

**File**: `README.md`

1. Find the section that describes **Gemini Today Gold Analysis** (Step 8 you recently added).
2. Update:
   - Any cron tables describing multiple runs (morning + evening) so they now show **one daily run** at 10:45 ICT (03:45 UTC).
   - Any prose that talks about “twice per day” — change to “once per day around 10:45 Asia/Bangkok”.
3. Keep the explanation of:
   - Vercel Hobby cron limits (once per day per expression).
   - The fact that a GitHub backup trigger will usually see `status: "skipped"` because the job is idempotent.

Run `npm run build` again after edits to ensure type/lint checks still pass.

---

### 3. Keep a single GitHub Actions backup at ~10:50 ICT

You want Vercel to be the primary scheduler, with GitHub acting as a **safety net** if Vercel misses a run. Extra triggers are safe because `runGoldAnalysis` is idempotent on `inputHash`.

**File**: `.github/workflows/scheduler-analysis.yml`

1. In the `on:` block, replace the multiple `schedule` entries with **one**:

```yaml
on:
  schedule:
    - cron: "50 3 * * *"   # ~10:50 ICT — backup a few minutes after Vercel 10:45
  workflow_dispatch:
```

2. Leave the job body untouched (it should:
   - GET `$ANALYSIS_CRON_URL`
   - Send `Authorization: Bearer $CRON_SECRET`
   - Use `jq` to assert `.ok == true`).

3. Add or keep an explanatory comment near the schedule, for future readers. For example:

```yaml
# Most days this run will return status "skipped" because Vercel's cron already
# ran and the inputHash is unchanged. This workflow is only a safety net if
# Vercel's cron fails or is delayed.
```

4. Do **not** modify any secrets in code — they are configured in GitHub:
   - `ANALYSIS_CRON_URL` = `https://goldee-five.vercel.app/api/scheduler/analysis`
   - `CRON_SECRET` = same secret value as Vercel `CRON_SECRET`.

**Verification hint for the human (documented, not executed here)**:

- After merging, they should go to GitHub → **Actions → “Scheduler Analysis”** and:
  - Trigger a manual run.
  - Confirm logs show HTTP 200 and a JSON body with `ok: true`.

---

### 4. Add InterGold as an expert commentary source

InterGold publishes daily Thai gold analysis “บทวิเคราะห์ราคาทองคำประจำวันที่ …”. We want to treat this as **expert commentary**, not generic news.

#### 4.1 Extend expert sources

**File**: `lib/analysis/fetch-expert-commentary.ts`

1. In the `EXPERT_SOURCES` array, append a new source:

```ts
const EXPERT_SOURCES: ExpertSource[] = [
  {
    name:      'World Gold Council',
    rssUrl:    'https://www.gold.org/goldhub/gold-focus/rss.xml',
    authority: 10,
  },
  {
    name:      'Kitco Commentary',
    rssUrl:    'https://www.kitco.com/rss/commentary.rss',
    authority: 8,
  },
  {
    name:      'BullionVault Research',
    rssUrl:    'https://www.bullionvault.com/gold-news/rss.do',
    authority: 7,
  },
  {
    name:      'InterGold',
    rssUrl:    'https://www.intergold.co.th/news_analysis/analysis/feed/',
    authority: 7, // mid–high weight; adjust later if needed
  },
]
```

2. Leave `EXPERT_SOURCE_NAMES` and parsing logic unchanged:
   - The RSS feed is WordPress-based and should work with the existing generic parser that reads `<title>`, `<description>`, `<link>`, `<pubDate>`, and `<dc:creator>`.

3. Build again:

```bash
npm run build
```

No new TS errors should appear.

#### 4.2 Optional: quick sanity check (dev only)

You don’t need to ship test files, but if you want to validate locally:

- Open a REPL or a small script that imports `fetchExpertCommentary`:

```ts
import { fetchExpertCommentary } from '@/lib/analysis/fetch-expert-commentary'

async function main() {
  const items = await fetchExpertCommentary()
  const intergold = items.filter((i) => i.source === 'InterGold')
  console.log(intergold.slice(0, 3))
}

main().catch(console.error)
```

- Confirm that:
  - `source` is `"InterGold"`.
  - `publishedAt` parses to a valid `Date`.
  - `quote` looks like a Thai analysis paragraph.

---

### 5. Ensure the analysis pipeline still works

**File**: `lib/analysis/analysis.service.ts`

- You **do not** need to change this file, but understand how it uses the new source:
  - It calls `fetchGlobalNews()` and `fetchExpertCommentary()` in parallel.
  - It passes `expertItems` into `buildInputBundle`.
  - InterGold commentary will now be part of `expertItems`, ranked by authority.

**Sanity check (dev or prod)**:

1. Make sure `.env.local` (dev) or Vercel envs (prod) have:
   - `GEMINI_API_KEY` set.
   - `CRON_SECRET` set.

2. Trigger a manual analysis run (example in prod):

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://goldee-five.vercel.app/api/admin/run-analysis
```

3. Expect JSON with:
   - `ok: true`
   - `status: "inserted"` / `"fallback"` / `"skipped"` depending on idempotency.

4. Optionally, inspect the `GoldAnalysis` row in the DB to see if any **InterGold** expert quotes show up in the payload (not required, but useful for debugging).

---

### 6. Final checklist before handing back

- [ ] `vercel.json` has exactly one cron for `/api/scheduler/analysis` at `45 3 * * *`.
- [ ] `app/api/scheduler/analysis/route.ts` header comment mentions a **single daily run ~10:45 ICT**.
- [ ] `README.md` scheduler section (Gemini analysis) describes **one daily run** and mentions Vercel cron + GitHub backup.
- [ ] `.github/workflows/scheduler-analysis.yml` has exactly one schedule: `50 3 * * *`, with a comment about idempotent “skipped” runs.
- [ ] `lib/analysis/fetch-expert-commentary.ts` includes an `InterGold` entry in `EXPERT_SOURCES` with a reasonable `authority` value.
- [ ] `npm run build` passes after all edits.
- [ ] (Optional) A manual `curl` to `/api/admin/run-analysis` with `CRON_SECRET` returns `ok: true`.

Once all boxes are checked, this fix is considered **complete** and the system will:

- Generate Gemini analysis **once per day** around 10:45 Asia/Bangkok.
- Use Vercel cron as the primary trigger and GitHub Actions as a safe backup.
- Include **InterGold** as an expert commentary source in the LLM’s reasoning.

