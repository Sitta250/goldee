# Goldee fix specs (Claude / implementer index)

Each file is **self-contained**: problem, goal, where to start in the repo, step-by-step plan, dependencies, verify.

**Original rollup:** [goldee_fix_list_for_cursor.md](./goldee_fix_list_for_cursor.md)

## Recommended order

### Phase 1 — ship trust + focus first

| File | Title |
|------|--------|
| [fix1.md](./fix1.md) | Canonical pricing across hero, AI, trend, history |
| [fix2.md](./fix2.md) | Update-time trust (app vs source timestamps) |
| [fix3.md](./fix3.md) | AI rationale rigid Thai format |
| [fix7.md](./fix7.md) | Remove unfinished UI / placeholders |
| [fix6.md](./fix6.md) | Homepage clutter + section order |
| [fix4.md](./fix4.md) | Above-the-fold “5 second” answer |

**Engineering in parallel with Phase 1**

| File | Title |
|------|--------|
| [fix19.md](./fix19.md) | Shared pricing view model |
| [fix20.md](./fix20.md) | Consistency checks before render |
| [fix21.md](./fix21.md) | Fallback states |

### Phase 2

| File | Title |
|------|--------|
| [fix5.md](./fix5.md) | Calculator prominence |
| [fix8.md](./fix8.md) | Mobile-first layout |
| [fix9.md](./fix9.md) | Visual hierarchy |
| [fix10.md](./fix10.md) | Clear movement labels |
| [fix11.md](./fix11.md) | Thai copy pass |
| [fix12.md](./fix12.md) | Source transparency |
| [fix13.md](./fix13.md) | AI guardrails |
| [fix14.md](./fix14.md) | Disclaimer placement |

### Phase 3 — growth

| File | Title |
|------|--------|
| [fix15.md](./fix15.md) | Price alerts |
| [fix16.md](./fix16.md) | User segments / entry paths |
| [fix17.md](./fix17.md) | AI as product feature |
| [fix18.md](./fix18.md) | “What to watch today” |

## Prompt for Claude

```text
Read fix/README.md for order. Implement fix/N.md one file at a time: follow its steps, list changed files, run npm run build and npm test. Ask before starting Phase 3 features if product scope (e.g. alerts channel) is undecided.
```
