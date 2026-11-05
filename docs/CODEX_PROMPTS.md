# Codex prompts

Paste one prompt per Codex task, in order. Each one is self-contained. Prompt 1 blocks the others.

## Prompt 1: account scorer

```
Repo: wallet-labeled-tape. Read CONTEXT.md and docs/PRD.md ("Wallet labeling rules" and
"Rate limits") first.

Build the account scorer in server/src/scoring/:

1. roundtrips.ts: given one account's fills (HlFill from server/src/hl/types.ts, oldest first),
   rebuild round-trip positions per coin. Track signed position from startPosition plus signed
   size (side "B" = +sz, "A" = -sz). A round trip starts when the position leaves 0 and ends when
   it returns to 0 or flips sign; a flip closes one trip and opens the next. Trip PnL = sum of
   closedPnl minus fee minus builderFee. Record open time, close time, max notional.
2. metrics.ts: from round trips and fills compute net PnL, return on volume (net PnL / traded
   notional), profit factor (gross win / gross loss), max drawdown (% of peak cumulative PnL),
   weeks positive (% of active weeks with positive PnL), closed positions, maker share (share of
   fills with crossed === false), fills per day, median hold seconds, median position notional,
   coverage start and coverage days (capped at config.scoring.windowDays).
3. tags.ts: map metrics to AccountTags (shared/protocol.ts) using ONLY config.scoring values:
   history pending / insufficient / partial / full, perf profitable / unprofitable / mixed,
   size large, activity automated / market_maker.
4. scorer.ts: a loop that pops ScoreQueue (queue.ts), pages InfoClient.userFillsByTime backwards
   or forwards over the last 30 days (max 2,000 per call, stop at 10,000 fills), computes metrics
   and tags, writes the accounts table (server/src/db.ts) and calls AccountBook.setTags. Re-queue
   expired accounts at low priority per config.freshness. Never exceed WeightBudget.
5. Wire scorer.ts into server/src/index.ts so tags appear on the live tape.
6. Add GET /api/account/:address to server/src/relay.ts returning the stored row.

Tests: node:test files next to each module (roundtrips.test.ts etc.) with hand-made fills
covering open, add, partial close, full close, flip, and the 10,000 fill cap. Add an
"npm test" script to server/package.json using "tsx --test".

Constraints: no new runtime dependencies. Thresholds only from config.ts. Keep npm run
typecheck green. Update CONTEXT.md CURRENT STATE and AI_USAGE.md (file log) at the end.
Open a PR; do not merge it.
```

## Prompt 2: positions and per-trade actions

```
Repo: wallet-labeled-tape. Read CONTEXT.md and docs/PRD.md (Step 5, "Reconnect and backfill").
Requires the scorer from prompt 1.

Build server/src/scoring/positions.ts: keep the current signed position per (address, coin) for
scored accounts, seeded from the last fetched fill (startPosition + its signed size). On each live
trade classify the action from position before and after: open (0 to non-zero), add (same sign,
larger), reduce (same sign, smaller), close (to 0), flip (sign changes). Replace
AccountBook.actionFor in server/src/accounts.ts with this. Persist to the positions table.

Reconcile: once per config.freshness.reconcileEveryMs, call InfoClient.clearinghouseState for
active-cohort accounts and overwrite drifted positions. On the stream "gap" event in index.ts,
mark positions needs_reconcile and refetch recent fills for affected accounts.

Tests with node:test for every action and for flip-through-zero. No new dependencies. Update
CONTEXT.md and AI_USAGE.md. Open a PR; do not merge it.
```

## Prompt 3: Profitable Account Flow (F4)

```
Repo: wallet-labeled-tape. Read docs/PRD.md feature F4. Requires prompts 1 and 2.

Build server/src/scoring/flow.ts: over a rolling config.flow.windowMinutes per coin, count
accounts tagged profitable (excluding activity market_maker) whose net long exposure rose vs
fell. Each account counts once, by the sign of its net change over the window, so both sides of
one trade never double-count and one whale counts as one. coveragePct = share of observed
notional in the window from scored accounts. Broadcast {type:"flow"} (FlowSnapshot in
shared/protocol.ts) every 5 s from index.ts. Tests with node:test. Update CONTEXT.md and
AI_USAGE.md. Open a PR; do not merge it.
```

## Prompt 4: forward test, pre-seed, replay

```
Repo: wallet-labeled-tape. Read docs/PRD.md "Validation" and "Risks". Requires prompt 1.

1. server/src/scripts/freeze-cohort.ts: write the current perf tags of all scored accounts to
   the cohorts table with one cohort_id and frozen_at = now, using only data before now.
2. server/src/scoring/forward-test.ts: after T0, for every open or add by a cohort account record
   mid price at +config.forwardTest.copyDelaySeconds, then at each horizonsMinutes. Report hit
   rate and average return after a round-trip taker fee per horizon and per group: profitable
   cohort, unprofitable cohort, a random size-matched cohort, all flow. Expose it at
   GET /api/forward-test.
3. server/src/scripts/preseed.ts: walk the busiest accounts seen in the trades table and score
   them within the weight budget, so the demo starts warm.
4. server/src/scripts/record-replay.ts and a --replay <file> flag in index.ts: record 2 minutes
   of raw trades messages to data/replays/*.jsonl and play them back through the same pipeline
   (venue WiFi fallback).

Add npm scripts for each. No new dependencies. Update CONTEXT.md and AI_USAGE.md. Open a PR;
do not merge it.
```
