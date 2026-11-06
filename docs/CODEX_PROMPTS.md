# Codex prompts

Aarit pastes these into Codex, one Codex task per prompt, **two at a time**. The two prompts in a
round own different files, so their pull requests do not conflict. Start a round only when the
round before it is merged. Claude reviews every PR; Aarit merges it.

Each task works in its own git worktree on a branch cut from the latest `origin/main` (see
`AGENTS.md` rule 6), never in the shared `Documentswallet-labeled-tape` folder: two tasks in one
folder would overwrite each other. Codex never edits `TASKS.md`, `AI_USAGE.md` or `CONTEXT.md`: two PRs editing the same log
lines would conflict. Codex lists every file it changed in the PR description instead, and Claude
adds those rows to the logs right after the merge. Codex keeps `npm run typecheck`,
`npm run build` and `npm test` green, opens a PR and never merges it.

Interfaces are already pinned: `shared/protocol.ts` (`AccountMetrics`, `AccountDetail`,
`ForwardTestReport`), `server/src/config.ts` (every threshold, including `scorer`, `positions`,
`replay`, `cohorts`) and the npm script names in both `package.json` files. Use them as they are.

| Round | Prompt | Task | Needs |
|:-|:-|:-|:-|
| 1 | Scoring math | X01 | |
| 1 | Position tracker logic | X02 | |
| 2 | Scorer loop, account API, freeze, pre-seed | X05 | X01, X02 merged |
| 2 | Flow and forward-test math | X03 | |
| 3 | Live positions, reconcile, flow broadcast | X06 | X03, X05 merged |
| 3 | Forward-test runner and API | X07 | X03, X05 merged |
| 4 | Replay (venue WiFi fallback) | X04 | X06 merged |

## Round 1, prompt X01: scoring math

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md, docs/ARCHITECTURE.md and the "Wallet
labeling rules" section of docs/PRD.md first. Your task is X01 in TASKS.md.

Files you own (change nothing else; if something else needs a change, say so in the PR):
server/src/scoring/roundtrips.ts, metrics.ts, tags.ts, their .test.ts files, and
.github/workflows/ci.yml.

Pure functions only: no network, no database, no imports from index.ts.

1. roundtrips.ts: buildRoundTrips(fills: HlFill[]) => RoundTrip[] (export the type). Fills are
   one account's, oldest first, any coins. Per coin, track the signed position from the first
   fill's startPosition plus signed size (side "B" = +sz, "A" = -sz); |x| < config.positions.
   zeroEpsilon counts as 0. A trip starts when the position leaves 0 and ends when it returns to
   0 or flips sign; a flip closes one trip and opens the next. If the first fill has a non-zero
   startPosition, that trip began before the history: keep it and mark truncated: true.
   RoundTrip: coin, openTime, closeTime (null while open), pnlUsd (sum of closedPnl minus fee
   minus builderFee; fee can be negative, a maker rebate, subtract it as is; builderFee may be
   missing), maxNotionalUsd, fillCount, truncated.
2. metrics.ts: computeMetrics(fills, trips, now) => AccountMetrics (shared/protocol.ts, every
   field, follow the doc comments there exactly). Only closed trips count toward netPnlUsd,
   profitFactor, maxDrawdownPct, weeksPositivePct and closedPositions. Hold time = closeTime minus
   openTime. flatShare uses config.scoring.marketMaker.flatNotionalUsd. coverageStart = oldest
   fill time; coverageDays capped at config.scoring.windowDays. hitFillCap = fill count reached
   config.fills.maxReachable.
3. tags.ts: assignTags(m: AccountMetrics | null) => AccountTags using ONLY config.scoring values.
   null => PENDING_TAGS. history: insufficient (under minClosedPositions or under
   minCoverageDays: perf null), partial (under fullCoverageDays), else full. perf: profitable,
   unprofitable, else mixed. size: large. activity: market_maker takes precedence over automated.
4. Tests (node:test, next to each module) with hand-made fills: open, add, partial close, full
   close, flip in one fill, truncated first trip, negative fee, missing builderFee, the 10,000
   cap, every tag boundary on both sides.
5. ci.yml: add "npm test" after typecheck.

Done when npm test, npm run typecheck and npm run build pass. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```

## Round 1, prompt X02: position tracker logic

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md, docs/ARCHITECTURE.md and "Step 5" in
docs/PRD.md first. Your task is X02 in TASKS.md.

Files you own (change nothing else): server/src/scoring/positions.ts and positions.test.ts.
Do not wire it into index.ts or accounts.ts; X06 does that.

1. classifyAction(before: number, after: number) => PositionAction: open (0 to non-zero), add
   (same sign, larger), reduce (same sign, smaller, not 0), close (to 0), flip (sign changes,
   including straight through 0 in one trade). |x| < config.positions.zeroEpsilon counts as 0.
2. positionsFromFills(fills: HlFill[]) => Map<coin, number>: the size after each coin's last
   fill (startPosition plus its signed size; "B" = +sz, "A" = -sz).
3. class PositionBook: seed(address, coin, size, at); seedFromFills(address, fills, at);
   apply(address, coin, signedDelta, at) => PositionAction, which returns "unknown" and stores
   nothing for an account that was never seeded; get(address, coin); overwrite(address, coin,
   size, at) for reconcile; markNeedsReconcile(addresses?: string[]); isSeeded(address);
   entries() for persistence (address, coin, size, updatedAt, needsReconcile).
4. Tests (node:test) for every action, flip through zero, float dust near 0, unknown for
   unseeded, overwrite clearing needsReconcile.

Done when npm test, npm run typecheck and npm run build pass. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```

## Round 2, prompt X03: flow and forward-test math

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md, docs/ARCHITECTURE.md ("The forward
test"), and in docs/PRD.md feature F4 and "Validation". Your task is X03 in TASKS.md.

Files you own (change nothing else): server/src/scoring/flow.ts, forward-test.ts and their
.test.ts files. Pure logic: no network, no database, not wired into index.ts (X06 and X07 do).

1. flow.ts: class FlowTracker.
   record({ time, coin, address, signedNotionalUsd, sizeUsd, scored, profitable }) for each side
   of each trade (profitable = perf "profitable" and activity not "market_maker").
   snapshot(now) => FlowSnapshot[] per coin over config.flow.windowMinutes: raised / cut =
   profitable accounts whose summed signed notional over the window is above / below 0, each
   account counted once. coveragePct = sizeUsd of scored sides / sizeUsd of all sides x 100.
   Drop events older than the window.
2. forward-test.ts:
   a. signalsFromFills(address, fills, t0) => Signal[]: fills after t0 that opened, added or
      flipped (use startPosition and signed size, not only dir), one signal per (coin, oid), at
      the first fill's time, direction long or short.
   b. measure(signals by group, priceAt(coin, time) => number | null) => ForwardTestResult[]
      (shared/protocol.ts) for every group and every config.forwardTest.horizonsMinutes. Entry =
      price at signal time + copyDelaySeconds, exit = entry time + horizon. Return in bps, negated
      for shorts, minus 2 x takerFeeBps. Hit = return after fee above 0. Skip a signal when either
      price is null and count only measured ones.
   c. pickRandomCohort(candidates, matchTo, seed) => addresses: size-matched (median position
      notional within the same quartile) and activity-matched, deterministic for a given seed.
3. Tests (node:test): one account on both sides never double-counts, a whale counts once,
   coverage math, window expiry, adds vs reduces in signals, one signal per oid, short returns,
   fee subtraction, null prices skipped, random cohort is deterministic.

Done when npm test, npm run typecheck and npm run build pass. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```

## Round 4, prompt X04: replay (venue WiFi fallback)

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md and docs/ARCHITECTURE.md ("Demo night")
first. Your task is X04 in TASKS.md.

Files you own (change nothing else): server/src/hl/replay.ts, server/src/scripts/
record-replay.ts, and in server/src/index.ts only the line that picks the stream.

1. record-replay.ts (npm run replay:record): connect with TradeStream for config.coins, write
   every trades batch as one JSON line {at, trades} to config.replay.dir/<ISO time>.jsonl for
   config.replay.recordSeconds (override with --seconds N), then exit with a summary line.
2. replay.ts: class ReplayStream with the same events as TradeStream (TradeStreamEvents). Plays
   a file at real speed in a loop; on each loop shifts trade times so they stay newest and tids
   stay unique. "latest" means the newest file in config.replay.dir; print a clear message and
   exit 1 if there is none.
3. index.ts: --replay <file|latest> picks ReplayStream; status mode stays "live" but log
   "[tape] REPLAY of <file>". Touch nothing else in index.ts.
4. Windows-safe: no POSIX-only syntax, file names without colons.

Done when npm run typecheck and npm run build pass and a 10 s recording plays back in
npm run dev:replay. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```

## Round 2, prompt X05: scorer loop, account API, freeze, pre-seed

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md, docs/ARCHITECTURE.md ("What happens to
one account", "The forward test", "Storage") and "Rate limits" in docs/PRD.md first. X01 and X02
are merged. Your task is X05 in TASKS.md.

Files you own: server/src/scoring/scorer.ts (+ test), server/src/scripts/freeze-cohort.ts,
server/src/scripts/preseed.ts, server/src/db.ts, server/src/relay.ts, server/src/index.ts,
server/src/hl/info.ts, server/src/fake.ts.

1. info.ts: after each userFillsByTime response, charge the extra weight
   (config.budget.userFillsWeightPer20Items per 20 fills returned) to WeightBudget. On 429, back
   off 10 s and retry once.
2. scorer.ts: a loop that pops ScoreQueue (sleep config.scorer.idlePollMs when empty) and pages
   InfoClient.userFillsByTime over the last config.scoring.windowDays, newest pages first, up
   to config.fills.maxReachable. Early stop per config.scorer.earlyStopMinSpanHours (see
   ARCHITECTURE.md). Sort the fills oldest first (by time, then tid) before buildRoundTrips,
   computeMetrics and assignTags (X01), which expect oldest first. Seed a PositionBook
   (X02) from the fills, write the account (add a metrics_json column; migrate an existing DB
   with ALTER TABLE if the column is missing), call AccountBook.setTags. Retry failures up to
   config.scorer.maxRetries, then leave the account Pending. Re-queue expired accounts at low
   priority per config.freshness with an incremental fetch from last_fill_time. On start, load
   every unexpired scored account from the DB into AccountBook so a restart is not cold.
3. index.ts: start the scorer (not in fake mode). Expose the PositionBook instance for X06 but do
   not change how actions are computed yet.
4. relay.ts: GET /api/account/:address => AccountDetail (shared/protocol.ts), 404 for an address
   never seen. In fake mode return believable fake metrics so the UI can be built offline.
5. freeze-cohort.ts (npm run freeze): insert every scored account's perf tag into cohorts with
   one cohort_id (ISO minute with no colons, e.g. 2026-11-06T22-30, so it is a valid Windows
   file name) and frozen_at = now; write cohorts/<id>.json at the repo root
   (config.cohorts.dir, relative to server/) with address, tags, metrics and scored_at per
   account; store the sha256 of that file in the DB (a cohort_files table: cohort_id, path,
   sha256); print the file path, the account counts per perf tag and the sha256.
   Refuse to run with fewer than config.cohorts.minScoredAccounts scored accounts unless
   --force.
6. preseed.ts (npm run preseed): score the busiest addresses in the trades table (by notional,
   last 48 h) within the weight budget, printing progress; safe to run while npm run dev runs.
7. Tests: scorer with a fake InfoClient covering paging, early stop, the 10,000 cap, retries.

Done when npm test, npm run typecheck and npm run build pass, and a live run shows accounts
moving from Pending to tags within 2 minutes. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```

## Round 3, prompt X06: live positions, reconcile, flow broadcast

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md, docs/ARCHITECTURE.md ("What happens to
one trade") and "Reconnect and backfill" in docs/PRD.md first. X03 and X05 are merged. Your
task is X06 in TASKS.md.

Files you own: server/src/accounts.ts, server/src/index.ts, server/src/scoring/reconcile.ts
(+ test). Do not touch relay.ts (X07 is editing it at the same time).

1. Replace AccountBook.actionFor with the PositionBook from X05: each trade side calls apply()
   with its signed size (buyer +sz, seller -sz). Persist positions to the positions table every
   config.positions.persistEveryMs and on shutdown.
2. reconcile.ts: every config.freshness.reconcileEveryMs, call InfoClient.clearinghouseState for
   scored accounts traded in the last hour (within the weight budget) and overwrite drifted
   positions; log how many drifted.
3. On the stream "gap" event: mark positions needs_reconcile, set connection to "reconciling",
   refetch fills since the gap for accounts seen in the last
   config.positions.gapRefetchRecentMinutes, then back to "live".
4. Feed FlowTracker (X03) from every trade side and broadcast {type:"flow"} every
   config.flow.broadcastEveryMs.

Done when npm test, npm run typecheck and npm run build pass and a live run shows open, add,
reduce, close and flip on the tape and flow messages every 5 s. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```

## Round 3, prompt X07: forward-test runner and API

```
Repo: wallet-labeled-tape. Work in your own git worktree on a new
branch cut from the latest origin/main (AGENTS.md rule 6). Read AGENTS.md, CONTEXT.md, docs/ARCHITECTURE.md ("The forward
test") and "Validation" in docs/PRD.md first. X03 and X05 are merged. Your task is X07 in TASKS.md.

Files you own: server/src/scripts/forward-test.ts, server/src/scoring/forward-test-store.ts,
and in server/src/relay.ts only the new route. Do not touch index.ts or accounts.ts (X06 is
editing them at the same time). Put your SQL in forward-test-store.ts, not db.ts.

1. forward-test.ts (npm run forward-test): load the latest cohort (or --cohort <id>), check the
   sha256 of cohorts/<id>.json matches what is in the DB, fetch each cohort account's fills after
   frozen_at through InfoClient, build signals and measure them with X03, using prices from the
   trades table (nearest trade at or after the target time, same coin, within
   config.forwardTest.priceMatchWindowSeconds; else null).
   Groups: profitable, unprofitable, random (pickRandomCohort, seed = cohort_id), all (every
   scored account). Exclude market makers. Store the ForwardTestReport and print it as a table
   ready to paste into the README.
2. relay.ts: GET /api/forward-test returns the latest stored ForwardTestReport, 404 before any.

Done when npm test, npm run typecheck and npm run build pass and the script prints a report on a
DB with a frozen cohort. Do not edit TASKS.md, AI_USAGE.md or CONTEXT.md; list every file you changed in the PR
description instead. Open a PR; do not merge it.
```
