# Tasks

Who did what on Wallet-Labeled Tape, one row per task. **Aarit** is the human on the team;
**Claude** (Claude Code) and **Codex** are AI tools. Files the AI tools touched are also logged in
`AI_USAGE.md`. Only real work goes in this file.

**Hard deadline: project submissions close Sat 2026-11-07 09:00 IST.** The "By" times below are
suggestions that work back from it.

## Done

| ID | Task | Who | When (IST) | Where |
|:-|:-|:-|:-|:-|
| T00 | Product idea and PRD | _Aarit fills in_ | Thu 11-05 | `docs/PRD.md` |
| T01 | Read the full PRD and the ETHGlobal Mumbai rules; recorded the deadline, the AI disclosure rule and the prize list | Claude | Fri 11-06 02:53 | `CONTEXT.md` |
| T02 | Created the public GitHub repo and the npm workspaces monorepo (server, web, shared), with CI | Claude | Fri 11-06 02:53 | `package.json`, `.github/workflows/ci.yml` |
| T03 | Converted the PRD doc to markdown for offline reading | Claude | Fri 11-06 02:53 | `docs/PRD.md` |
| T04 | Wire protocol shared by backend and browser | Claude | Fri 11-06 02:53 | `shared/protocol.ts` |
| T05 | Every PRD threshold in one config file | Claude | Fri 11-06 02:53 | `server/src/config.ts` |
| T06 | Live trade stream for BTC, ETH and SOL with both addresses, reconnect with backoff, ping | Claude | Fri 11-06 02:53 | `server/src/hl/stream.ts` |
| T07 | REST client behind a weight-based token bucket (1,000 of the 1,200 per minute) | Claude | Fri 11-06 02:53 | `server/src/hl/info.ts`, `server/src/hl/budget.ts` |
| T08 | SQLite schema (accounts, positions, trades kept 48 h, cohorts) on built-in `node:sqlite` | Claude | Fri 11-06 02:53 | `server/src/db.ts` |
| T09 | Local relay for the browser: WebSocket plus a health endpoint | Claude | Fri 11-06 02:53 | `server/src/relay.ts` |
| T10 | Scoring priority queue: notional x recency, cap of 500, skips accounts under $5k | Claude | Fri 11-06 02:53 | `server/src/scoring/queue.ts` |
| T11 | Fake feed with random tags, for UI work without the network | Claude | Fri 11-06 02:53 | `server/src/fake.ts` |
| T12 | Hour-0 API check: confirmed trade and fill fields on the live API, found the extra `builderFee` | Claude | Fri 11-06 02:53 | `server/src/probe.ts` |
| T13 | First tape UI: coin tabs, status bar, filters, tape with both accounts, drawer shell, footer note | Claude | Fri 11-06 02:53 | `web/src/` |
| T14 | Fixed two setup bugs: the relay took the web port (now `RELAY_PORT`), the SQLite file slipped into git | Claude | Fri 11-06 02:53 | `server/src/config.ts`, `.gitignore` |
| T15 | README, CONTEXT, AI log and the Codex prompts for the backend | Claude | Fri 11-06 02:53 | `README.md`, `CONTEXT.md`, `docs/CODEX_PROMPTS.md` |
| T16 | This task list; AI log reorganized, "Not built by AI" section left for Aarit | Claude | Fri 11-06 03:04 | `TASKS.md`, `AI_USAGE.md` |
| T17 | Second-machine setup: `npm run setup`, context files for Claude and Codex, line endings, clear port-in-use error | Claude | Fri 11-06 03:04 | `scripts/setup.mjs`, `CLAUDE.md`, `AGENTS.md` |
| T18 | Fixed the tape order: trades now sort newest first by exchange time, not arrival order | Claude | Fri 11-06 03:04 | `web/src/useTape.ts`, `server/src/relay.ts` |

## Open

In dependency order. "Owner" is the plan, not a record: change it when someone else takes a task.
ETHGlobal says projects built entirely by AI may lose finalist and partner-prize eligibility, so
set the owner to Aarit on the build tasks you take on yourself.

| ID | Task | Owner | Needs | By (IST) | Details |
|:-|:-|:-|:-|:-|:-|
| T20 | Scorer: rebuild round trips, compute metrics, assign tags, `/api/account/:address` | Codex | | Fri 12:00 | Prompt 1 in `docs/CODEX_PROMPTS.md`. Blocks almost everything |
| T21 | Pick up to 3 partner prizes and read each prize's rules | Aarit | | Fri 12:00 | No Hyperliquid prize at Mumbai. Sponsors listed in `CONTEXT.md` |
| T22 | Integrate the sponsors picked in T21 | Aarit to assign | T21 | Fri 20:00 | ENS names next to addresses is the cheapest fit if ENS is picked |
| T23 | Position action on every trade (open, add, reduce, close, flip), hourly reconcile, gap backfill | Codex | T20 | Fri 16:00 | Prompt 2 |
| T24 | Drawer shows real metrics from `/api/account/:address` | Claude | T20 | Fri 15:00 | `web/src/App.tsx` |
| T25 | Freeze the forward-test cohort | Codex builds, Aarit runs | T20 | Fri 18:00 | Prompt 4 step 1. Every hour before 09:00 Sat is test time; the PRD's 24 to 36 h no longer fits, so report the real window |
| T26 | Profitable Account Flow, backend | Codex | T23 | Fri 20:00 | Prompt 3 |
| T27 | Flow cards in the left panel | Claude | T26 | Fri 21:00 | `web/src/App.tsx` |
| T28 | Forward-test measurement and `/api/forward-test` | Codex | T25 | Fri 22:00 | Prompt 4 step 2 |
| T29 | Pre-seed script, then keep the backend scoring on the demo laptop for 1 h or more | Codex builds, Aarit runs | T20 | Fri 23:00 | Prompt 4 step 3. The SQLite cache stays on the machine that ran it |
| T30 | Replay recorder for the venue WiFi fallback | Codex | | Fri 23:00 | Prompt 4 step 4 |
| T31 | Tune tag thresholds on real scored accounts | Aarit | T20 | Sat 02:00 | Only `server/src/config.ts` |
| T32 | Forward-test card in the app and the results table in the README | Claude | T28 | Sat 06:00 | Shows the result whatever it is |
| T33 | Record the backup demo video | Aarit | T20 to T32 | Sat 07:00 | Follow the 3-minute script at the end of `docs/PRD.md` |
| T34 | Write the "Not built by AI" section of `AI_USAGE.md` | Aarit | | Sat 08:00 | |
| T35 | Create the project on the ETHGlobal dashboard and submit: repo link, video, partner prizes | Aarit | T33 | Sat 08:30 | Submissions close 09:00 |
| T36 | Rehearse the 3-minute demo | Aarit | T33 | Sat 09:00 | Judging starts 09:30 |

## Stretch (only once the open list is done)

| ID | Task | Hours (PRD) |
|:-|:-|:-|
| S1 | AI tape narrator: one line every 30 s from local Ollama, measured wording only | 3 |
| S2 | Alerts when a Profitable or Large account opens or flips a big position | 1 |
| S3 | Watchlist: star accounts, pin their trades, saved in the browser | 1 |
| S4 | Liquidation levels for up to 10 starred accounts | 4 |

## How to update this file

- Finished a task: move its row to Done and fill in Who and When. AI tools also add their files to
  `AI_USAGE.md` in the same commit.
- Started a task: put "(doing)" after the owner, so the other machine or teammate can see it.
- New work found: add a row to Open with the next free ID.
