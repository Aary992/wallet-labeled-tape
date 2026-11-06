# Tasks

Who did what on Wallet-Labeled Tape. **Aarit** is the human on the team and owns the product,
the calls that decide what ships, the release gate and the demo. **Claude** (Claude Code) and
**Codex** are AI tools. Files the AI tools touched are also logged in `AI_USAGE.md`. Only real
work goes in this file. How the parts fit: `docs/ARCHITECTURE.md`.

**Hard deadline: project submissions close Sat 2026-11-07 09:00 IST.**

## Progress

| # | Track | What "done" means | Tasks | Done |
|:-|:-|:-|:-|:-|
| 1 | Backend | Every account scored, every trade tagged with its action, flow and forward test computed | X01 to X07 | 0 of 7 |
| 2 | Infrastructure | Demo laptop running all night, replay fallback recorded, cohort frozen and pushed, CI runs tests | A06, A07, A10, X04, C24 | 1 of 5 |
| 3 | Frontend | Drawer, flow cards and forward-test card show real data | C21, C22, C23 | 0 of 3 |
| 4 | Testing | PRs reviewed, accounts spot-checked, thresholds picked, forward test reported | C20, C25, A08, A09 | 0 of 4 |
| 5 | Submission | Video, AI section, project submitted, demo rehearsed | A11 to A15, C26 | 0 of 6 |

Mark a track done only when every task in it is done.

## Aarit

Product owner and release gate: nothing merges, freezes or ships without him.

| ID | Task | Track | Needs | By (IST) | Done |
|:-|:-|:-|:-|:-|:-|
| A00 | Product idea and PRD | | | Thu 11-05 | ✅ Thu 11-05 (_Aarit adds detail_) |
| A01 | Set the build order (backend and infrastructure first) and split the work three ways | | | Fri 16:00 | ✅ Fri 11-06 15:50 |
| A02 | Approve the architecture in `docs/ARCHITECTURE.md` | 1 | C19 | Fri 16:30 | |
| A03 | Pick up to 3 partner prizes after reading each prize's rules (shortlist in `docs/PRIZES.md`) | 5 | | Fri 18:00 | |
| A04 | Run Codex: paste the prompts from `docs/CODEX_PROMPTS.md` two at a time, round 1 now, the next round once the last one is merged | 1 | A02 | Fri 16:30 | |
| A05 | Merge each Codex PR on GitHub once Claude's review says ready | 1 | C20 | per PR | |
| A06 | Demo laptop on duty: plugged in, sleep off, `npm run dev` running from X05's merge until judging | 2 | X05 | Fri 20:30 | |
| A07 | Record a 2-minute replay on good WiFi: `npm run replay:record` | 2 | X04 | Sat 01:00 | |
| A08 | Spot-check 5 scored accounts against the Hyperliquid website (PnL sign, size, activity) | 4 | X05 | Fri 22:15 | |
| A09 | Pick the final tag thresholds from Claude's tuning report | 4 | C25 | Fri 22:15 | |
| A10 | Freeze the cohort at T0: `npm run freeze`, then commit and push the cohort file | 2 | A08, A09 | Fri 22:30 | |
| A11 | Pick the forward-test horizon that leads the pitch (15, 60 or 240 min) | 5 | X07 | Sat 06:30 | |
| A12 | Record the backup demo video (3-minute script in `docs/PRD.md`) | 5 | C23 | Sat 07:00 | |
| A13 | Write the "Not built by AI" section of `AI_USAGE.md` | 5 | | Sat 08:00 | |
| A14 | Create the project on the ETHGlobal dashboard and submit: repo, video, partner prizes | 5 | A12 | Sat 08:30 | |
| A15 | Rehearse the 3-minute demo | 5 | A12 | Sat 09:00 | |

## Codex

Backend modules and their tests. Prompts in `docs/CODEX_PROMPTS.md`: two tasks at a time, one round
after another. Claude ticks these rows after each merge (Codex does not edit this file).

| ID | Task | Track | Round | Needs | By (IST) | Done |
|:-|:-|:-|:-|:-|:-|:-|
| X01 | Scoring math: round trips, metrics, tags, tests, `npm test` in CI | 1 | 1 | | Fri 18:30 | |
| X02 | Position tracker logic: open, add, reduce, close, flip | 1 | 1 | | Fri 18:30 | |
| X03 | Flow and forward-test math | 1 | 2 | | Fri 20:30 | |
| X04 | Replay recorder and playback (venue WiFi fallback) | 2 | 4 | X06 | Sat 00:30 | |
| X05 | Scorer loop, `/api/account/:address`, `npm run freeze`, `npm run preseed` | 1 | 2 | X01, X02 | Fri 20:30 | |
| X06 | Live position actions, hourly reconcile, gap backfill, flow broadcast | 1 | 3 | X03, X05 | Fri 22:30 | |
| X07 | Forward-test runner and `/api/forward-test` | 1 | 3 | X03, X05 | Fri 22:30 | |

## Claude

Architecture, UI, copy, PR reviews, analysis for Aarit's calls, demo material.

| ID | Task | Track | Needs | By (IST) | Done |
|:-|:-|:-|:-|:-|:-|
| C01 | Read the full PRD and the ETHGlobal Mumbai rules; recorded the deadline, the AI disclosure rule and the prize list (`CONTEXT.md`) | | | | ✅ Fri 11-06 02:53 |
| C02 | Public GitHub repo and the npm workspaces monorepo (server, web, shared), with CI | | | | ✅ Fri 11-06 02:53 |
| C03 | PRD converted to markdown for offline reading (`docs/PRD.md`) | | | | ✅ Fri 11-06 02:53 |
| C04 | Wire protocol shared by backend and browser (`shared/protocol.ts`) | | | | ✅ Fri 11-06 02:53 |
| C05 | Every PRD threshold in one config file (`server/src/config.ts`) | | | | ✅ Fri 11-06 02:53 |
| C06 | Live trade stream for BTC, ETH and SOL with both addresses, reconnect with backoff, ping | | | | ✅ Fri 11-06 02:53 |
| C07 | REST client behind a weight-based token bucket (1,000 of the 1,200 per minute) | | | | ✅ Fri 11-06 02:53 |
| C08 | SQLite schema (accounts, positions, trades kept 48 h, cohorts) on built-in `node:sqlite` | | | | ✅ Fri 11-06 02:53 |
| C09 | Local relay for the browser: WebSocket plus a health endpoint | | | | ✅ Fri 11-06 02:53 |
| C10 | Scoring priority queue: notional x recency, cap of 500, skips accounts under $5k | | | | ✅ Fri 11-06 02:53 |
| C11 | Fake feed with random tags, for UI work without the network | | | | ✅ Fri 11-06 02:53 |
| C12 | Hour-0 API check: confirmed trade and fill fields on the live API, found the extra `builderFee` | | | | ✅ Fri 11-06 02:53 |
| C13 | First tape UI: coin tabs, status bar, filters, tape with both accounts, drawer shell, footer note | | | | ✅ Fri 11-06 02:53 |
| C14 | Fixed two setup bugs: the relay took the web port (now `RELAY_PORT`), the SQLite file slipped into git | | | | ✅ Fri 11-06 02:53 |
| C15 | README, CONTEXT, AI log and the first Codex prompts | | | | ✅ Fri 11-06 02:53 |
| C16 | First task list; AI log reorganized, "Not built by AI" section left for Aarit | | | | ✅ Fri 11-06 03:04 |
| C17 | Second-machine setup: `npm run setup`, context files for Claude and Codex, line endings, clear port-in-use error | | | | ✅ Fri 11-06 03:04 |
| C18 | Fixed the tape order: newest first by exchange time, not arrival order | | | | ✅ Fri 11-06 03:04 |
| C19 | Infrastructure design (`docs/ARCHITECTURE.md`), Codex prompts split into parallel rounds, pinned interfaces, config and script names, this checksheet | 1 | A01 | Fri 16:30 | ✅ Fri 11-06 16:05 |
| C20 | Review every Codex PR against its prompt and the PRD; tell Aarit "ready to merge" or what to send back | 4 | each PR | per PR | |
| C21 | Drawer shows real metrics from `/api/account/:address` | 3 | X05 | Fri 21:30 | (doing) UI built 16:20 with empty states; finish check once X05 serves data |
| C22 | Flow cards in the left panel | 3 | X06 | Sat 00:00 | (doing) UI built 16:20; finish check once X06 broadcasts flow |
| C23 | Forward-test card in the app and the results table in the README | 3 | X07 | Sat 06:30 | (doing) card built 16:20; README table once X07 reports |
| C24 | Demo-night runbook in plain words for Aarit (`docs/RUNBOOK.md`): start, check, freeze, recover | 2 | X05 | Fri 21:00 | ✅ Fri 11-06 16:40 (commands checked again after X05 lands) |
| C25 | Tuning report: how scored accounts spread across each threshold, with options for Aarit to pick | 4 | 1.5 h of scoring | Fri 22:00 | |
| C26 | Final demo script and README pass | 5 | X07 | Sat 07:00 | (doing) draft in `docs/DEMO.md` 16:50; numbers filled in Saturday |

## Partner prizes (after A03)

Rows get added here once Aarit picks. Claude's shortlist with the fit and cost of each is in
`docs/PRIZES.md` (recommended: Arkiv from scratch, Hedera SDKs, EF CROPS).

## Stretch (only once tracks 1 to 4 are done)

| ID | Task | Hours (PRD) |
|:-|:-|:-|
| S1 | AI tape narrator: one line every 30 s from local Ollama, measured wording only | 3 |
| S2 | Alerts when a Profitable or Large account opens or flips a big position | 1 |
| S3 | Watchlist: star accounts, pin their trades, saved in the browser | 1 |
| S4 | Liquidation levels for up to 10 starred accounts | 4 |

## How to update this file

- Finished a task: put ✅ and the IST time in Done, and update the count in Progress. AI tools
  also add their files to `AI_USAGE.md` in the same commit.
- Started a task: put "(doing)" in Done, so the other machine can see it.
- New work found: add a row under the right person with the next free ID (A, X or C).
- Someone else takes a task: move the row to that person's table and keep its ID.
