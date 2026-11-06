# AI usage

ETHGlobal asks every team to document where and how AI tools were used, down to specific files.
This file is that record. Every file an AI tool writes or changes gets a row in the file log, in
the same commit as the change. Who did each task is in `TASKS.md`.

## Tools

| Tool | Used for |
|:-|:-|
| Claude Code | Repo setup, code, docs and fixes listed in the file log |
| Codex | Backend tasks X01 to X07 from `docs/CODEX_PROMPTS.md`, each as its own pull request. Codex lists its files in the PR; Claude copies them into this log after Aarit approves the merge |

## File log

| When (IST) | Tool | Files | What the AI did |
|:-|:-|:-|:-|
| Fri 11-06 02:53 | Claude Code | `docs/PRD.md` | Converted the PRD doc to markdown, content unchanged |
| Fri 11-06 02:53 | Claude Code | `package.json`, `package-lock.json`, `server/package.json`, `web/package.json`, `server/tsconfig.json`, `web/tsconfig.json`, `web/vite.config.ts`, `.gitignore`, `.nvmrc`, `.env.example`, `LICENSE`, `.github/workflows/ci.yml`, `.claude/launch.json` | Generated the monorepo scaffold and CI |
| Fri 11-06 02:53 | Claude Code | `shared/protocol.ts` | Wrote the wire protocol types shared by backend and browser |
| Fri 11-06 02:53 | Claude Code | `server/src/config.ts` | Moved every PRD threshold into one config file |
| Fri 11-06 02:53 | Claude Code | `server/src/hl/stream.ts`, `server/src/hl/types.ts`, `server/src/hl/budget.ts`, `server/src/hl/info.ts` | Trade stream with reconnect and ping, Hyperliquid wire types, weight token bucket, REST client |
| Fri 11-06 02:53 | Claude Code | `server/src/db.ts`, `server/src/relay.ts`, `server/src/accounts.ts`, `server/src/index.ts`, `server/src/fake.ts`, `server/src/probe.ts`, `server/src/scoring/queue.ts`, `server/src/scoring/README.md` | SQLite schema, browser relay, account book, entry point, fake feed, API probe, scoring queue |
| Fri 11-06 02:53 | Claude Code | `web/index.html`, `web/src/App.tsx`, `web/src/useTape.ts`, `web/src/styles.css`, `web/src/main.tsx`, `web/src/vite-env.d.ts` | First tape UI: top bar, filters, tape, account drawer shell, footer note |
| Fri 11-06 02:53 | Claude Code | `README.md`, `CONTEXT.md`, `AI_USAGE.md`, `docs/CODEX_PROMPTS.md` | Project docs and the Codex prompts |
| Fri 11-06 03:04 | Claude Code | `AI_USAGE.md`, `TASKS.md`, `docs/CODEX_PROMPTS.md` | Reorganized this log; wrote the task list of who did what |
| Fri 11-06 03:04 | Claude Code | `scripts/setup.mjs`, `package.json`, `CLAUDE.md`, `AGENTS.md`, `.gitattributes`, `.claude/launch.json`, `README.md`, `CONTEXT.md` | One-command setup for a second machine, context files for Claude and Codex, line-ending rules |
| Fri 11-06 03:04 | Claude Code | `server/src/relay.ts` | Clear error when the relay port is already taken |
| Fri 11-06 03:04 | Claude Code | `server/src/relay.ts`, `web/src/useTape.ts` | Tape sorted newest first by exchange time (coins arrive on separate streams) |
| Fri 11-06 15:59 | Claude Code | `server/src/config.ts`, `shared/protocol.ts`, `package.json`, `server/package.json` | Pinned the interfaces Codex builds against: new config sections (scorer, positions, replay, cohorts), API types for account detail and the forward test, npm script names |
| Fri 11-06 15:59 | Claude Code | `docs/ARCHITECTURE.md`, `docs/CODEX_PROMPTS.md` | Wrote the infrastructure design and the forward-test design; rewrote the Codex prompts as 3 parallel waves with file ownership |
| Fri 11-06 15:59 | Claude Code | `TASKS.md`, `CONTEXT.md`, `AGENTS.md`, `README.md`, `server/src/scoring/README.md`, `AI_USAGE.md` | Rebuilt the task list as a 5-track tracker plus one checksheet each for Aarit, Codex and Claude; updated the context files to match |
| Fri 11-06 16:03 | Claude Code | `docs/CODEX_PROMPTS.md`, `AGENTS.md`, `CLAUDE.md`, `TASKS.md`, `CONTEXT.md`, `docs/ARCHITECTURE.md`, `AI_USAGE.md` | Reordered the Codex prompts into rounds of two (X05 also stores the cohort sha256 for X07 to check); Codex now lists its files in the PR and Claude logs them after the merge, so parallel PRs never conflict on the log files |
| Fri 11-06 16:16 | Claude Code | `web/src/App.tsx`, `web/src/Drawer.tsx`, `web/src/Panels.tsx`, `web/src/Tags.tsx`, `web/src/api.ts`, `web/src/format.ts`, `web/src/styles.css` | Account drawer with full metrics and positions, Profitable Account Flow cards, forward-test card with horizon tabs; built against the pinned API types with empty states until the backend endpoints land |
| Fri 11-06 16:17 | Claude Code | `docs/RUNBOOK.md`, `docs/CODEX_PROMPTS.md`, `README.md`, `TASKS.md` | Demo-night runbook in plain steps for Aarit; X05 prompt fix so the cohort file name has no colons (invalid on Windows) |
| Fri 11-06 16:20 | Claude Code | `docs/PRIZES.md`, `docs/DEMO.md`, `README.md`, `TASKS.md` | Partner-prize shortlist from the official ETHGlobal Mumbai prize list for Aarit to choose from; first draft of the 3-minute demo script |
| Fri 11-06 16:24 | Claude Code | `server/src/config.ts`, `shared/protocol.ts`, `TASKS.md`, `AI_USAGE.md` | Reviewed X01 and X02 (merged together in a scratch copy: 54 tests pass; scored 6 live accounts with X01). Set fullCoverageDays to 29 so a full 30-day history counts as full; clarified the hitFillCap comment Codex flagged |
| Fri 11-06 16:10 | Codex | `server/src/scoring/positions.ts`, `server/src/scoring/positions.test.ts` | X02 (PR #1, merged 16:28): position action classifier (open, add, reduce, close, flip), positions from fills, PositionBook with reconcile flags, and tests |
| Fri 11-06 16:12 | Codex | `server/src/scoring/roundtrips.ts`, `server/src/scoring/roundtrips.test.ts`, `server/src/scoring/metrics.ts`, `server/src/scoring/metrics.test.ts`, `server/src/scoring/tags.ts`, `server/src/scoring/tags.test.ts`, `.github/workflows/ci.yml` | X01 (PR #2, merged 16:28): round-trip rebuild per coin, every account metric, tag rules from config, boundary tests, `npm test` in CI |
| Fri 11-06 16:30 | Claude Code | `AI_USAGE.md`, `TASKS.md`, `CONTEXT.md`, `docs/DEMO.md`, `docs/PRIZES.md` | Merged X01 and X02 into main after Aarit approved (54 tests, CI green); logged Codex's files; corrected earlier log times that had been estimated instead of taken from the commits |
| Fri 11-06 16:33 | Claude Code | `AGENTS.md`, `docs/CODEX_PROMPTS.md`, `CONTEXT.md`, `AI_USAGE.md` | Round 2 prep: every Codex task works in its own git worktree from the latest main (two local tasks in one folder would overwrite each other); X05 sorts fills oldest first before scoring |
| Fri 11-06 22:36 | Claude Code | `server/src/scoring/scorer.ts`, `server/src/scoring/scorer.test.ts`, `server/src/scoring/flow.ts`, `server/src/scoring/flow.test.ts`, `server/src/index.ts`, `server/src/db.ts`, `server/src/relay.ts`, `server/src/accounts.ts`, `server/src/hl/info.ts`, `server/src/fake.ts` | Aarit cut scope to a basic submission build, so Claude wrote the backend directly instead of Codex rounds 2 to 4: scorer loop on the X01 functions with early stop and per-item weight, live position actions from the X02 PositionBook, Profitable Account Flow broadcast, `/api/account/:address`, warm restart from SQLite, tests |
| Fri 11-06 22:36 | Claude Code | `web/src/App.tsx`, `web/src/Drawer.tsx`, `web/src/Panels.tsx`, `web/src/api.ts`, `web/src/styles.css`, `package.json`, `server/package.json` | Tape shows each account's latest tags; drawer polish; removed the forward-test card and the npm scripts for parts that were cut |
| Fri 11-06 22:40 | Claude Code | `README.md`, `TASKS.md`, `CONTEXT.md`, `docs/RUNBOOK.md`, `docs/DEMO.md`, `docs/CODEX_PROMPTS.md`, `docs/ARCHITECTURE.md`, `AI_USAGE.md` | Docs updated for the scope cut: README Status lists what shipped and what was cut, task list marks cut rows, runbook and demo script match the basic build |

## Not built by AI

<!-- Written by Aarit. AI tools never write or edit this section. -->
