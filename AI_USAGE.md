# AI usage

ETHGlobal asks every team to document where and how AI tools were used, down to files. This file
is that record. Update it whenever AI writes or changes a file.

## Tools

| Tool | Used for |
|:-|:-|
| Claude (claude.ai, Claude Code) | PRD drafting and review, repo setup, scaffolding listed below |
| Codex | Planned for backend modules listed in `docs/CODEX_PROMPTS.md` (not used yet) |

## What the humans did

The idea, the product decisions and the PRD's rules (which tags exist, the thresholds, the honest
scope wording, the forward-test design) were set by the team. AI turned those decisions into the
scaffold below. Everything from here on is logged per file.

## File log

| Date (IST) | Files | Tool | What AI did | Human part |
|:-|:-|:-|:-|:-|
| 2026-11-06 02:50 | `docs/PRD.md` | Claude | Copied the team's PRD doc to markdown | PRD content written and decided by the team |
| 2026-11-06 02:50 | `package.json`, `server/package.json`, `web/package.json`, configs, `.gitignore`, `LICENSE` | Claude | Generated the monorepo scaffold | Chose the stack (Node, SQLite, Vite + React) |
| 2026-11-06 02:55 | `shared/protocol.ts`, `server/src/config.ts` | Claude | Typed the wire protocol; moved every PRD threshold into one config file | Thresholds come from the PRD |
| 2026-11-06 02:55 | `server/src/hl/*`, `server/src/relay.ts`, `server/src/db.ts`, `server/src/index.ts`, `server/src/accounts.ts`, `server/src/fake.ts`, `server/src/probe.ts`, `server/src/scoring/queue.ts` | Claude | Generated the trade stream, reconnect, weight budget, REST client, SQLite schema, relay, fake feed, API probe and priority queue | Architecture and limits from the PRD |
| 2026-11-06 03:00 | `web/src/*` | Claude | Generated the first tape UI: top bar, filters, tape, drawer shell, footer note | Layout and copy from the PRD's UI section |
| 2026-11-06 03:00 | `README.md`, `CONTEXT.md`, `docs/CODEX_PROMPTS.md`, `.github/workflows/ci.yml` | Claude | Wrote docs and CI | |

## Not AI

Add rows here for work the team writes by hand. Judges look for meaningful human contribution:
ETHGlobal says projects built entirely by AI may not be eligible for partner prizes or finalist.
