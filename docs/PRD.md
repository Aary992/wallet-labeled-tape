> Copy of the planning PRD (claude.ai doc "Wallet-Labeled Tape: PRD", 2026-11-05) so Codex and teammates can read it offline. The doc is the source of truth.

# Wallet-Labeled Tape: PRD

2026-11-05 · @karit

## Overview

Wallet-Labeled Tape is a live trade feed for Hyperliquid that shows which account is on each side of a trade and what the trade did to that account's position (open, add, reduce, close, flip). Each account carries separate tags for size, activity and observed performance, so a viewer can filter to accounts that were net profitable over a stated window, with the sample size and history coverage shown next to every tag.

**Problem.** Order flow tools like candl.live show size, side and price, but every print is anonymous. A trader cannot tell a winning fund from a gambler who is about to be liquidated.

**Why only on-chain.** Hyperliquid publishes both wallet addresses on every fill through a free public API. A centralized exchange never exposes this, so the product cannot be copied on Binance-style data.

**Built for:** an ETHGlobal hackathon weekend, solo or a team of two, with ₹0 spent on APIs, hosting or data.

## Review gaps and fixes

An external review found eight gaps in v1 of this PRD; each one is fixed in the section named below.

| # | Gap | Fix | Where |
|:-|:-|:-|:-|
| 1 | "Smart money" = win rate + flat $ profit, counted per fill | Score round-trip positions, not fills; use net PnL after fees, return on volume, profit factor, max drawdown and weekly consistency over a fixed 30-day window; rename the tag to "Profitable (30d)" | Labeling rules |
| 2 | A buy may close a short, not open a long | Reconstruct each scored account's position (seed from `userFills` `startPosition` , then update from the live stream) and tag every trade open / add / reduce / close / flip | Labeling rules, Architecture |
| 3 | Gauge double-counts and one whale can dominate | Gauge counts accounts, not dollars: how many profitable accounts raised vs cut long exposure in 15 minutes, each account once, plus coverage % | Features (F4) |
| 4 | History is capped (2,000 fills a call, 10,000 most recent) | Record the history window each account actually covers; "Partial history" and "Insufficient history" states; "First observed" replaces "Fresh" | Labeling rules |
| 5 | A one-per-second queue still grows without bound | Weight-based token bucket under the 1,200 per minute budget, priority by trade size, a queue cap that drops small accounts, scheduled refreshes by staleness, visible "Pending" | Architecture |
| 6 | An account is not a trader; labels overlap | Size, activity and performance are independent tags; "Likely automated" and "Likely market maker" wording; on-screen note that hedges elsewhere and multi-wallet owners are invisible | Labeling rules, UI |
| 7 | Value claim untested, look-ahead bias | Freeze a cohort using only data before T0, measure its later moves after delay and fees against baselines; the demo shows this result, not a cherry-picked chart | Validation |
| 8 | Cost and schedule claims too broad | ₹0 is for a local demo on your own laptop and internet; a public service needs an always-on host and durable database; schedule split into a 18h demo and a ~32h trustworthy build | Tech stack, Build plan |

The review's API figures (fill caps, rate limits, 10-user WebSocket cap) come from Hyperliquid's docs; confirm them in hour 0.

## Goals and success metrics

The goal is a live, working demo that makes judges say "this can't exist on a CEX" within 30 seconds.

**Goals**

- Stream every Hyperliquid trade for 3 coins (BTC, ETH, SOL) live, with both account addresses.

- Tag each account on three independent axes (size, activity, 30-day performance) from reconstructed positions, with sample size and coverage shown.

- Tag each trade by what it did to the account's position: open, add, reduce, close or flip.

- Show Profitable Account Flow: how many profitable accounts raised vs cut long exposure in the last 15 minutes, with coverage.

- Run one honest forward test during the event and show its result in the demo.

- Spend ₹0 for the local demo.

**Non-goals (this weekend)**

- Placing trades, holding funds or connecting a wallet

- Mobile app, user accounts, login

- Chains other than Hyperliquid

- Guaranteed-accurate labels; they are heuristics and say so on screen

**Success metrics**

| Metric | Target |
|:-|:-|
| Trade to screen delay | under 1 second |
| Share of on-screen notional from accounts with a scored tag | 60%+ after 1 hour of running |
| Trades tagged with a position action (open, close, etc.) | 90%+ for scored accounts |
| REST weight used | under 80% of the 1,200 per minute budget |
| Demo crashes | 0 in a 3-minute run |
| Forward test | run and reported, whatever the result |
| External spend | ₹0 |

## Users and stories

The main user is an active crypto trader who already watches order flow and wants an edge on who is behind it.

| User | Story |
|:-|:-|
| Active trader | I want to see only trades from accounts that were profitable over the last 30 days, and whether each trade opened or closed a position. |
| Active trader | I want an alert when a large or profitable account opens a big new position so I don't miss it. |
| Curious trader | I want to click an account and see its PnL, drawdown, sample size and history coverage so I can judge the tag myself. |
| Contrarian | I want to see what accounts with large 30-day losses are opening so I can fade them. |
| Skeptical judge | I want proof the tag predicts anything, not a chart picked after the fact. |

## Features

Five MVP features make the demo; the stretch features are added only if the MVP is done by Saturday night.

| # | Feature | Priority | Requirement |
|:-|:-|:-|:-|
| F1 | Live tagged tape | MVP | Each row: time, coin, side, price, size USD, account (0x12…ab), its tags, and the position action (open, add, reduce, close, flip). Under 1 second from trade to screen. |
| F2 | Account scoring | MVP | New account goes into the priority queue and shows "Pending". Fetch fills with `userFillsByTime` , rebuild round-trip positions, compute metrics, store tags with sample size, coverage window and scored time. |
| F3 | Filters | MVP | Chips per tag (Profitable, Unprofitable, Large, Likely automated, etc.), a "Profitable only" button, "hide closes" toggle, minimum size slider ($1k to $1M). |
| F4 | Profitable Account Flow | MVP | Over a rolling 15 minutes per coin: count of profitable accounts whose net long exposure rose, count whose fell, and coverage = share of observed notional from scored accounts. Each account counts once by the sign of its net change, so both sides of one trade never double-count and one whale counts as one. Example: "12 profitable accounts raised ETH long exposure, 4 cut it. Coverage 68%." |
| F5 | Account drawer | MVP | Tags, net PnL after fees, return on volume, profit factor, max drawdown, weeks positive, closed positions, history covered (e.g. "last 9 days"), current position, last 20 trades, explorer link. |
| S1 | AI tape narrator | Stretch | Ollama reads the last 60 seconds of tagged flow and writes one line every 30 seconds, using only measured wording ("profitable accounts", never "smart money"). |
| S2 | Big-trade alerts | Stretch | Notification when a Profitable or Large account opens or flips a position over a set size. |
| S3 | Watchlist | Stretch | Star accounts; pin their trades to the top. Saved in the browser. |
| S4 | Liquidation levels | Stretch | For starred accounts (max 10, the per-IP user subscription cap), read open positions and show liquidation prices on a mini chart. |

## Wallet labeling rules

Each account gets three independent tags plus a history state; an account can be Large, Likely automated and Profitable at the same time.

**Step 1, rebuild positions, not fills.** Sort the account's fills by time per coin. Use `startPosition` and signed size to track the position; a round trip starts when the position leaves 0 and ends when it returns to 0 or flips sign (a flip closes one round trip and opens the next). Many partial fills become one position. Each round trip's PnL = sum of its `closedPnl` minus fees.

**Step 2, record coverage.** The oldest fill returned sets the history start. Coverage = days between that and now, capped at the 30-day window. Busy accounts often hit the 10,000-fill cap and get short coverage; that is shown, never hidden.

**Step 3, compute metrics over the covered window**

| Metric | Definition |
|:-|:-|
| Net PnL | Sum of round-trip PnL after fees, USD |
| Return on volume | Net PnL divided by total traded notional (comparable across account sizes) |
| Profit factor | Gross winning PnL divided by gross losing PnL |
| Max drawdown | Largest fall in cumulative PnL from a peak, as % of that peak |
| Weeks positive | Share of active weeks with positive net PnL |
| Closed positions | Count of finished round trips (the sample size) |
| Maker share | Share of fills that were not `crossed` (resting orders) |

**Step 4, assign tags**

| Axis | Tag | Rule |
|:-|:-|:-|
| History | Pending | Not yet fetched (shown with a spinner) |
| History | Insufficient history | Fewer than 20 closed positions or under 7 days covered; no performance tag |
| History | Partial history | 7 to 29 days covered; tag shown with "covers N days" |
| History | First observed | First seen by this app at time X; a fact, not a claim that the account is new |
| Performance | Profitable (30d) | Net PnL > 0, profit factor ≥ 1.3, return on volume ≥ 0.05%, max drawdown ≤ 50%, weeks positive ≥ 60% |
| Performance | Unprofitable (30d) | Net PnL **Step 5, tag each trade by position action.** For scored accounts the app keeps the current position in memory (seeded from the last fill, then updated from each live trade, and reconciled with `clearinghouseState` once an hour for accounts in the active cohort). Each new trade is classified from position before and after: open (0 to non-zero), add (same sign, larger), reduce (same sign, smaller), close (to 0) or flip (sign changes). Unscored accounts show "action unknown".

**Freshness.** Tags expire: active cohort accounts every 1 hour, others every 6 hours, rescored with an incremental `userFillsByTime` call from the last fetch time. All thresholds sit in one config file.

**Honest scope.** A tag describes one Hyperliquid account, not a person. The drawer says: "Based on N closed positions over the last D days on Hyperliquid. Hedges on other venues and other wallets of the same owner are not visible."

## Architecture and data

The whole system is one Node process on your laptop plus a browser page; Hyperliquid's free public API is the only data source.

_[Diagram in the PRD doc: system architecture · 2 free sources, 1 local backend]_

A trade arrives, the listener looks up both accounts in the cache, updates their in-memory positions, tags the trade's position action and sends it to the browser. An account not yet scored goes into the scoring queue and shows "Pending".

**Rate limits: budget, priority, cap**

- **Token bucket on weight, not on requests.** The scorer spends at most 1,000 of the 1,200 weight per minute REST budget, leaving headroom. Each call's weight (base cost plus response size) is charged before it runs.

- **Priority queue.** Priority = trade notional × recency. A $500k trader is scored before a $2k one.

- **Queue cap.** At most 500 waiting accounts; when full, the lowest priority drops out. Accounts under $5k notional are never queued.

- **Scheduled refresh.** A separate scheduler re-queues expired tags (1 hour for the active cohort, 6 hours for others) at low priority, with incremental fetches so refreshes stay cheap.

- **Pre-seeding.** The night before the demo, a script walks the busiest accounts seen over several hours, so the stage demo starts warm.

- **Market-wide stream only.** The live feed uses the public `trades` channel for each coin, which is not limited by the 10-users-per-IP cap on user subscriptions. Per-user subscriptions are kept for the 10 starred accounts (S4).

- **Reconnect and backfill.** On a WebSocket drop, reconnect with backoff, then refetch recent trades so no gap appears in positions; mark positions "needs reconcile" until `clearinghouseState` confirms them.

**Data sources (all free, no key)**

| Source | Call | Used for |
|:-|:-|:-|
| `wss://api.hyperliquid.xyz/ws` | subscribe `{"type":"trades","coin":"ETH"}` | Live trades with `users: [buyer, seller]` |
| `POST https://api.hyperliquid.xyz/info` | `{"type":"userFillsByTime","user":"0x…","startTime":…}` | Fill history with `startPosition` , `dir` , `closedPnl` , `crossed` ; max 2,000 per call, 10,000 most recent |
| Same endpoint | `{"type":"clearinghouseState","user":"0x…"}` | Current positions to reconcile reconstructed ones |

Confirm field names and current rate limits in Hyperliquid's API docs in the first hour; these are from memory.

**Data model (SQLite)**

| Table | Columns |
|:-|:-|
| `accounts` | address (key), history_state, perf_tag, size_tag, activity_tag, net_pnl_usd, return_on_volume, profit_factor, max_drawdown_pct, weeks_positive_pct, closed_positions, maker_share, coverage_start, coverage_days, first_observed_at, scored_at, expires_at |
| `positions` | address, coin, size, avg_entry, updated_at, needs_reconcile |
| `trades` (last 48h) | id, time, coin, side, price, size_usd, buyer, seller, buyer_action, seller_action |
| `cohorts` | cohort_id, frozen_at, address, perf_tag_at_freeze (for the forward test) |

## UI

One dark, single-page screen with the tape in the middle; everything else sits around it.

- **Top bar:** coin tabs (BTC, ETH, SOL), connection dot (green live, amber reconciling, red reconnecting), accounts scored, queue length, REST budget used.

- **Left panel:** Profitable Account Flow per coin ("12 raised, 4 cut, coverage 68%"), plus the forward-test result card once it exists.

- **Center, the tape:** newest on top. Columns: time, side, price, size USD, account, tags (performance, size, activity as separate chips), position action (open, add, reduce, close, flip). Pending accounts show a spinner, never a guessed tag.

- **Filter row:** tag chips, "Profitable only", "hide closes", minimum size slider.

- **Right drawer (on account click):** all metrics, closed positions, "covers N days", current position, last 20 trades, explorer link, star, and the honest-scope note.

- **Footer note, always visible:** "Tags describe Hyperliquid accounts over a stated window. Not a full picture of any trader. Not advice."

- **Bottom strip (stretch):** AI narrator line.

The aggr fork already has the tape and coin switching; the badge column, filter row, gauge and drawer are the new work.

## Tech stack and cost

The local demo costs ₹0, assuming your own laptop and internet; a reliable public service would not be free, so it is out of scope for the weekend.

| Layer | Choice | Cost |
|:-|:-|:-|
| Data | Hyperliquid public WebSocket + info API | ₹0, no key |
| Backend | Node.js 20, `ws` library | ₹0 |
| Storage | SQLite via `better-sqlite3` | ₹0 |
| Frontend | Fork of aggr (Vue), or Vite + React if starting fresh | ₹0 |
| AI narrator (stretch) | Ollama with a small local model such as Llama 3.2 3B | ₹0, runs on the laptop |
| Hosting | localhost for the demo; a recorded video for judges | ₹0 |
| Code repo | Public GitHub repo (ETHGlobal requires one) | ₹0 |

**What a public version would need.** An always-on server for the WebSocket and scorer (serverless functions time out), and a durable database, since a local SQLite file is not kept between Vercel Function runs. Free tiers of hosted Postgres and small VMs exist but have sleep, size or uptime limits. For judging, run locally and share a recorded video plus the GitHub repo.

**Limits to respect locally:** the REST weight budget (handled by the token bucket), and laptop RAM if Ollama runs at the same time.

## Validation

The forward test checks the core claim: do accounts tagged Profitable using only past data make moves that are useful afterwards, after delay and fees?

- **Freeze a cohort at T0** (Friday night of the event). Tag accounts using only fills before T0 and store them in `cohorts`. No later data can change who is in it.

- **Observe after T0** for 24 to 36 hours. Record every position action by cohort accounts.

- **Measure each signal with delay.** When a cohort account opens or adds, record the price 10 seconds later (a realistic copy delay), then the price 15, 60 and 240 minutes later. Subtract Hyperliquid's taker fee for a round trip.

- **Compare against baselines:** (a) a random cohort of accounts with similar size and activity, (b) all accounts' flow, (c) the Unprofitable cohort, (d) doing nothing.

- **Report:** hit rate and average return after delay and fees per horizon, with the number of signals. Put the table in the README and on a card in the app.

The demo shows this result whatever it is. A null result ("Profitable cohort did no better than random over 36 hours, n = 140") is still honest and is a stronger pitch than a hand-picked chart. Thirty-six hours is too short to prove an edge; the README says so and describes the longer test.

## Build plan

There are two builds: a constrained demo in about 18 hours, and a trustworthy version in about 32 hours. Pick the first if you are solo and the second only with a teammate.

| Block | Demo build (hours) | Trustworthy build (hours) |
|:-|:-|:-|
| Check the API, fork aggr | 1 | 1 |
| Live stream, reconnect | 2 | 4 (with backfill and reconcile) |
| Scoring | 5 (fills-based metrics, prepared account list) | 9 (round-trip rebuild, coverage, all tags) |
| Position actions per trade | 2 (from `dir` on fetched fills) | 4 (live position tracking + reconcile) |
| Rate-limit budget, priority queue, refresh | 1 (simple cap) | 3 |
| UI: tape, filters, drawer | 5 | 5 |
| Profitable Account Flow | 1 | 2 |
| Forward test | 0 (skip, say so) | 3 |
| Demo prep, README, backup video | 1 | 1 |
| **Total** | **18** | **32** |

**Order of work (trustworthy build).** Freeze the forward-test cohort as early as possible, ideally Friday night, because the test needs time to run while you build the UI.

**Team split for two people:** one owns the backend (stream, scoring, positions, budget, forward test), the other owns the UI against a fake trade feed until the backend is ready.

**If time is left:** S2 alerts (1 hour), S1 AI narrator (3 hours), S3 watchlist (1 hour), S4 liquidation levels (4 hours).

## Risks, open questions and demo

The biggest risk is a cold cache on stage, so the demo runs on a laptop that has been scoring wallets for at least an hour.

| Risk | Fallback |
|:-|:-|
| Queue grows faster than the budget allows | Priority by notional, cap of 500, skip accounts under $5k, pre-seed overnight |
| Few tags at demo time (cold cache) | Pre-seeded SQLite file; start the backend an hour early |
| Reconstructed positions drift from reality | Hourly `clearinghouseState` reconcile; "needs reconcile" state shown |
| Venue WiFi drops | Record a 2-minute replay of real trades and play it back through the same pipeline |
| API fields or limits differ from these notes | Hour 0 is for checking; field mapping and thresholds sit in one file each |
| A judge calls the tags misleading | Every tag shows its sample size and coverage; the forward test answers whether it predicts anything |
| Forward test shows no edge | Present it honestly; it shows rigor, and the tool still explains who is trading |

**Open questions**

- Which sponsors at this ETHGlobal have prizes that fit (Hyperliquid, others)?

- Solo or with a teammate?

- Fork aggr or start fresh with React?

- Which forward-test horizon matters most for the pitch: 15, 60 or 240 minutes?

**3-minute demo script**

- **Hook (20s):** "Every order flow tool shows you what traded. Ours shows you which accounts traded, and whether they opened or closed."

- **The tape (40s):** live trades with tags and actions; click "Profitable only" and "hide closes" and the noise disappears.

- **The account (40s):** open one: net PnL after fees, drawdown, 63 closed positions, "covers 30 days".

- **The flow (30s):** "12 profitable accounts raised ETH longs in 15 minutes, 4 cut. Coverage 68%."

- **The proof (30s):** the forward-test card: cohort frozen Friday 22:00, results vs random accounts after a 10-second delay and fees.

- **Why on-chain and close (20s):** Binance can't show any of this; Hyperliquid's open data makes it possible, for ₹0. Next: longer test, alerts, AI narrator.
