# CONTEXT

Read this first at the start of every session (Claude, Codex or a teammate), then `TASKS.md`.
Update CURRENT STATE at the end of every session. `TASKS.md` is the only task list.

## Project

Wallet-Labeled Tape: live Hyperliquid trade tape with both accounts on every trade, tagged by
size, activity and 30-day performance, plus the position action each trade caused. Spec:
`docs/PRD.md`. How it fits together and the build order: `docs/ARCHITECTURE.md`. Event: ETHGlobal Mumbai 2026, From Scratch track, in person at Jio World
Convention Centre.

## Hard deadline

**Project submissions due Sat 2026-11-07 09:00 IST.** Judging 09:30. Stop coding at submission.
Freeze the forward-test cohort as early as possible; every hour before 09:00 is test time.

## ETHGlobal rules that bind this repo

1. From Scratch track: everything is built during the event (hacking began Thu 2026-11-05 21:00 IST).
2. Public GitHub repo at submission. Commit small and often; judges read the history.
3. AI use must be documented per file in `AI_USAGE.md`. AI-only projects may lose partner and
   finalist eligibility. Aarit writes the "Not built by AI" section himself.
4. Up to 3 partner prizes. There is no Hyperliquid prize at Mumbai (sponsors: 0G, Uniswap, Arc,
   Hedera, Arkiv, Whitechain, Ethereum Foundation, World, ENS, 1inch, Definitive, Chainlink).

## Lanes

| Who | Owns |
|:-|:-|
| Aarit (A rows) | Product owner and release gate: approves the design, runs Codex, merges PRs, picks thresholds and prizes, runs the demo laptop, freezes the cohort, demo and submission |
| Codex (X rows) | Backend modules and tests, two at a time in rounds (prompts in `docs/CODEX_PROMPTS.md`) |
| Claude (C rows) | Architecture, UI, copy, reviewing every Codex PR, tuning report and runbook for Aarit, demo script |

## Conventions

- Node 22.13+, TypeScript run with `tsx`, ESM, imports with `.ts` extensions.
- SQLite via built-in `node:sqlite` (not better-sqlite3: no native build on Windows).
- Every threshold in `server/src/config.ts`. Never hard-code one elsewhere.
- Every REST call goes through `InfoClient`, which charges `WeightBudget` first.
- Wording: "Profitable (30d)", "Likely automated", never "smart money". No em dashes in UI copy.
- Unscored accounts show Pending, never a guessed tag.
- LF line endings everywhere (`.gitattributes`).

## Working on two machines

Claude's memory does not travel between machines; this repo does. `CLAUDE.md`, this file and
`TASKS.md` hold everything a session needs.

First time on a machine, in PowerShell, from the folder you launch Claude in (on the laptop that
is your Documents folder):

```powershell
git clone https://github.com/Aary992/wallet-labeled-tape.git
cd wallet-labeled-tape
npm run setup
```

`npm run setup` checks Node, installs packages, adds the `wallet-tape` preview to
`.claude\launch.json` in your Documents folder (Claude's preview reads that file from the folder
Claude was launched in, not from this repo; the old file is kept as `launch.json.bak`) and checks
the Hyperliquid API. Launching Claude from another folder: `npm run setup -- --claude-root "<that folder>"`.

- Sitting down: `git pull`, then `npm install`.
- Walking away: commit, then `git push`. Unpushed work does not exist on the other machine.
- Never in git, per machine: `server/data/tape.db` (scored accounts and recent trades). Scoring
  warms up wherever the backend runs, so run it on the demo laptop for an hour before judging.
- Only one backend per machine: a second copy stops with a "port is already taken" message.

## CURRENT STATE (Fri 2026-11-06 16:05 IST)

- Infrastructure designed (`docs/ARCHITECTURE.md`). Codex work split into rounds of two tasks with
  non-overlapping files; round 1 (X01, X02) is ready to paste. Codex leaves AI_USAGE, TASKS and
  CONTEXT to Claude, who logs each PR after the merge. Interfaces pinned in
  `shared/protocol.ts` (`AccountMetrics`, `AccountDetail`, `ForwardTestReport`), new config
  sections (`scorer`, `positions`, `replay`, `cohorts`) and npm script names (`test`, `freeze`,
  `preseed`, `forward-test`, `replay:record`, `dev:replay`). Those scripts point at files Codex
  has not written yet, so they fail until their task lands.
- Laptop is set up (`npm run setup` passed 16:00); plan is for it to be the demo machine.

Earlier (03:15):

- Live stream works for BTC, ETH and SOL; confirmed against the real API with `npm run probe`.
- Fills confirmed: `startPosition`, `dir`, `closedPnl`, `crossed`, `fee`, plus `builderFee`
  (subtract it too), returned oldest first.
- Relay at ws://localhost:8787/ws, UI at http://localhost:5181, fake feed with `npm run dev:fake`.
- All accounts show Pending and all actions "unknown" until the scorer (X05) lands.
- CI (typecheck and build) is green on main.
