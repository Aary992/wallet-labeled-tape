# Scoring (open work)

This folder is where the PRD's labeling rules get built. The stream and relay already work; every
account currently shows as **Pending** and every trade action as **unknown**.

| File | Status | What it does |
|:-|:-|:-|
| `queue.ts` | done | Priority queue: notional x recency, cap 500, skip under $5k |
| `scorer.ts` | TODO | Pops the queue, pages `userFillsByTime` back 30 days (2,000 per call, stop at 10,000), stores metrics + tags |
| `roundtrips.ts` | TODO | Step 1: rebuild round-trip positions per coin from `startPosition` + signed size; a flip closes one trip and opens the next |
| `metrics.ts` | TODO | Step 3: net PnL after fees, return on volume, profit factor, max drawdown, weeks positive, closed positions, maker share |
| `tags.ts` | TODO | Step 4: history state, perf / size / activity tags from `config.scoring` |
| `positions.ts` | TODO | Step 5: in-memory position per scored account, classify each live trade open / add / reduce / close / flip, hourly reconcile |
| `flow.ts` | TODO | F4: per coin, 15 min rolling count of profitable accounts that raised vs cut net long exposure, coverage % |
| `forward-test.ts` | TODO | Validation: freeze a cohort at T0, record cohort signals, price after 10 s, then 15 / 60 / 240 min, minus taker fee |

All thresholds are already in `../config.ts`. Prompts for Codex are in `docs/CODEX_PROMPTS.md`.
