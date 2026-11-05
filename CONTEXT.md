# CONTEXT

Read this first at the start of every session (Claude, Codex or a teammate). Update CURRENT STATE
and OPEN WORK at the end of every session.

## Project

Wallet-Labeled Tape: live Hyperliquid trade tape with both accounts on every trade, tagged by
size, activity and 30-day performance, plus the position action each trade caused. Spec:
`docs/PRD.md`. Event: ETHGlobal Mumbai 2026, From Scratch track, in person at Jio World
Convention Centre.

## Hard deadline

**Project submissions due Sat 2026-11-07 09:00 IST.** Judging 09:30. Stop coding at submission.
Freeze the forward-test cohort as early as possible; every hour before 09:00 is test time.

## ETHGlobal rules that bind this repo

1. From Scratch track: everything is built during the event (hacking began Thu 2026-11-05 21:00 IST).
2. Public GitHub repo at submission. Commit small and often; judges read the history.
3. AI use must be documented per file in `AI_USAGE.md`. AI-only projects may lose partner and
   finalist eligibility, so humans own real parts and log them.
4. Up to 3 partner prizes. There is no Hyperliquid prize at Mumbai (sponsors: 0G, Uniswap, Arc,
   Hedera, Arkiv, Whitechain, Ethereum Foundation, World, ENS, 1inch, Definitive, Chainlink).

## Lanes

| Who | Owns |
|:-|:-|
| Codex | Backend modules in `server/src/scoring/` (prompts in `docs/CODEX_PROMPTS.md`), tests |
| Claude | UI, copy, demo script, reviewing Codex PRs |
| Aarit | Product calls, sponsor choice, demo, the parts logged as human in `AI_USAGE.md` |

## Conventions

- Node 22.13+, TypeScript run with `tsx`, ESM, imports with `.ts` extensions.
- SQLite via built-in `node:sqlite` (not better-sqlite3: no native build on Windows).
- Every threshold in `server/src/config.ts`. Never hard-code one elsewhere.
- Every REST call goes through `InfoClient`, which charges `WeightBudget` first.
- Wording: "Profitable (30d)", "Likely automated", never "smart money". No em dashes in UI copy.
- Unscored accounts show Pending, never a guessed tag.

## CURRENT STATE (2026-11-06 03:00 IST)

- Live stream works for BTC, ETH, SOL; confirmed against the real API with `npm run probe`.
- Fills confirmed: `startPosition`, `dir`, `closedPnl`, `crossed`, `fee`, plus `builderFee`
  (subtract it too), returned oldest first.
- Relay at ws://localhost:8787/ws, UI at http://localhost:5181, fake feed with `npm run dev:fake`.
- All accounts show Pending and all actions "unknown" until the scorer lands.

## OPEN WORK

1. Scorer: round trips, metrics, tags (Codex prompt 1). Highest priority, everything depends on it.
2. Position tracking and per-trade actions (Codex prompt 2).
3. Profitable Account Flow gauge (Codex prompt 3).
4. Forward test, pre-seed script, replay recorder (Codex prompt 4).
5. UI: drawer metrics from a new `/api/account/:address` endpoint, flow cards, forward-test card.
6. Decide partner prizes (ENS names on addresses is the cheapest fit) and record a backup video.
