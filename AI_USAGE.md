# AI usage

ETHGlobal asks every team to document where and how AI tools were used, down to specific files.
This file is that record. Every file an AI tool writes or changes gets a row in the file log, in
the same commit as the change. Who did each task is in `TASKS.md`.

## Tools

| Tool | Used for |
|:-|:-|
| Claude Code | Repo setup, code, docs and fixes listed in the file log |
| Codex | Not used yet. Planned for the backend tasks in `docs/CODEX_PROMPTS.md` |

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
| Fri 11-06 16:05 | Claude Code | `server/src/config.ts`, `shared/protocol.ts`, `package.json`, `server/package.json` | Pinned the interfaces Codex builds against: new config sections (scorer, positions, replay, cohorts), API types for account detail and the forward test, npm script names |
| Fri 11-06 16:05 | Claude Code | `docs/ARCHITECTURE.md`, `docs/CODEX_PROMPTS.md` | Wrote the infrastructure design and the forward-test design; rewrote the Codex prompts as 3 parallel waves with file ownership |
| Fri 11-06 16:05 | Claude Code | `TASKS.md`, `CONTEXT.md`, `AGENTS.md`, `README.md`, `server/src/scoring/README.md`, `AI_USAGE.md` | Rebuilt the task list as a 5-track tracker plus one checksheet each for Aarit, Codex and Claude; updated the context files to match |
| Fri 11-06 16:20 | Claude Code | `docs/CODEX_PROMPTS.md`, `AGENTS.md`, `CLAUDE.md`, `TASKS.md`, `CONTEXT.md`, `docs/ARCHITECTURE.md`, `AI_USAGE.md` | Reordered the Codex prompts into rounds of two; Codex now lists its files in the PR and Claude logs them after the merge, so parallel PRs never conflict on the log files |

## Not built by AI

<!-- Written by Aarit. AI tools never write or edit this section. -->
