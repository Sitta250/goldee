# Goldee — Fix List for Cursor

## Top priority

### 1. Fix all data mismatches
- Make sure the **hero price cards**, **AI rationale**, **trend section**, and **history data** all use the same source.
- Do not let AI summarize from stale or different cached data.
- Use one canonical pricing object across the whole app.
- Add validation so the page fails safely if numbers do not match.

### 2. Fix update-time trust issues
- The site says prices update every 5 minutes, but also shows stale timestamps.
- Make update logic consistent everywhere.
- Show:
  - `last updated at`
  - `source updated at`
  - `next refresh in` if relevant
- Never claim live or frequent updates unless the data actually refreshes on that schedule.

### 3. Rewrite the AI rationale block
- Current AI text feels generic and sometimes disconnected from the displayed numbers.
- Replace it with a rigid format:

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

- Keep it short, useful, and tied to real data.
- Do not show filler text like “ไม่มีข่าวล่าสุด” unless that is genuinely the best answer and still useful.

---

## Product fixes

### 4. Make the homepage answer the user’s question in 5 seconds
Above the fold, users should instantly see:
- current buy price
- current sell price
- change vs previous update
- change vs yesterday
- last updated time
- one-line rationale
- calculator entry point

### 5. Make the calculator more prominent
- Move calculator access higher on the homepage.
- Many Thai users care about:
  - “ขายทอง 1 บาท ได้เท่าไร”
  - “ซื้อทอง 2 บาท ใช้เงินเท่าไร”
  - bullion vs jewelry estimate
- The calculator should feel like a core feature, not a side tool.

### 6. Reduce homepage clutter
- Price + rationale + calculator should come before articles and supporting content.
- Articles are secondary.
- FAQ is supporting content.
- Keep the top of the page focused on fast decision-making.

### 7. Remove unfinished UI signals
- Remove placeholder ad blocks from production.
- Replace any dummy labels, mock text, or incomplete states.
- Anything that looks unfinished hurts trust immediately.

---

## UX and design fixes

### 8. Improve mobile-first layout
- Most users will likely check gold prices from mobile.
- The first screen on mobile should not be crowded.
- Prioritize:
  1. price
  2. movement
  3. timestamp
  4. rationale
  5. calculator

### 9. Strengthen visual hierarchy
- Price should be the dominant element.
- Day-over-day movement should be second.
- AI rationale should be short and scannable.
- Secondary sections should not compete with the main value.

### 10. Make market movement clearer
- Use clear labels for:
  - change from previous update
  - change from yesterday
  - 7-day trend
- Do not mix these into one ambiguous “up/down” story.
- Users need to know exactly what comparison they are looking at.

### 11. Use clearer Thai copy
- Avoid generic finance wording.
- Use direct, simple copy that answers real user intent.
- Example improvements:
  - Instead of vague summary text, say exactly what changed.
  - Use labels that help action: `ราคาล่าสุด`, `เปลี่ยนจากเมื่อวาน`, `วิเคราะห์วันนี้`, `คำนวณมูลค่าทอง`

---

## Trust and credibility fixes

### 12. Add stronger source transparency
- Clearly show where the price comes from.
- Example:
  - `อ้างอิงราคาจากสมาคมค้าทองคำ`
  - `อัปเดตข้อมูลล่าสุดเมื่อ ...`
- If there is any delay between source update and your app update, show that honestly.

### 13. Add guardrails for AI content
- AI text must never invent reasons without evidence.
- If explanation confidence is low, say so cleanly.
- AI should summarize based on:
  - price movement
  - market inputs
  - trusted news inputs
- Avoid dramatic phrasing or fake certainty.

### 14. Tighten disclaimer placement
- Keep the disclaimer, but do not let it feel like the site is avoiding responsibility for bad data.
- The order should be:
  1. trustworthy data
  2. useful explanation
  3. clear disclaimer
- Disclaimer is not a substitute for accuracy.

---

## Feature improvements

### 15. Add meaningful alerts
Good retention features:
- notify when price hits user target
- notify when price changes by more than X baht
- notify on major morning/evening updates
- notify when unusual volatility happens

### 16. Segment users better
Your users are probably not one group.
Create paths for:
- fast check users
- beginners
- active followers

Possible entry points:
- `เช็คราคาเร็ว`
- `วิเคราะห์วันนี้`
- `คำนวณทองของฉัน`

### 17. Turn AI rationale into a real product feature
The AI section should not be decoration.
It should help the user answer:
- why did price move?
- what matters today?
- should I act now or wait?

### 18. Add “what to watch today”
This can be a tiny section under the rationale:
- USD / Fed
- geopolitical risk
- Thai baht
- global gold trend
- domestic price change rounds

That makes the site feel alive and useful daily.

---

## Engineering fixes

### 19. Create one shared pricing model
Use one typed object for all price-related UI.

Suggested shape:

```ts
type GoldPriceSnapshot = {
  sourceName: string
  sourceUpdatedAt: string
  appUpdatedAt: string
  buyPrice: number
  sellPrice: number
  changeFromPreviousUpdate: number
  changeFromYesterday: number
  change7d: number
}
```

- Every section should read from this same structure.
- Do not let separate components fetch their own price truth.

### 20. Add consistency checks before render
Before rendering:
- verify all displayed prices match the latest snapshot
- verify AI rationale references the same snapshot
- verify timestamps are current
- verify deltas are computed from the right baseline

### 21. Add fallback states
If data is stale or unavailable:
- show a safe fallback state
- hide AI explanation if it cannot be trusted
- show a clear message like:
  - `กำลังอัปเดตราคาล่าสุด`
  - `ข้อมูลวิเคราะห์ยังไม่พร้อมใช้งาน`

Do not show broken or contradictory content.

---

## What to do next

## Phase 1 — must fix now
- fix data mismatches
- fix timestamps
- remove unfinished UI
- tighten homepage hierarchy
- rewrite AI rationale format

## Phase 2 — should build next
- make calculator more prominent
- add trust labels and source timing
- improve mobile-first layout
- make comparison labels clearer

## Phase 3 — growth features
- alerts
- saved watch targets
- more useful history views
- better daily brief format

---

## Brutal summary

The idea is good.

The current weakness is not the concept.
The weakness is **trust, consistency, and focus**.

If the numbers disagree, the product fails.
If the AI feels generic, the differentiator fails.
If the homepage takes too long to understand, the utility fails.

Fix those three things first:
- trustworthy data
- sharp daily explanation
- faster decision-focused UX
