# AGENTS.md

Instructions for Codex and any other coding agent working in this repo.

1. Read `CONTEXT.md` first, then `TASKS.md`, then the prompt you were given from
   `docs/CODEX_PROMPTS.md`. The spec is `docs/PRD.md`.
2. Your lane is the backend: `server/src/` and its tests. Do not change `web/` unless the prompt
   says so.
3. Node 22.13 or newer is required (the backend uses the built-in `node:sqlite`). Set up with
   `npm ci`. Before opening a PR, `npm run typecheck` and `npm run build` must pass.
4. ETHGlobal rule: add every file you write or change to the file log in `AI_USAGE.md`, with Tool
   set to Codex, in the same PR. Never write or edit the "Not built by AI" section.
5. In `TASKS.md`, move the rows you finished to Done with Who = Codex and the time in IST. Never add
   rows for work that did not happen.
6. Thresholds only in `server/src/config.ts`. Every REST call goes through `InfoClient`, which
   charges `WeightBudget`. No new runtime dependencies unless the prompt allows it.
7. Update CURRENT STATE in `CONTEXT.md`. Open a PR and never merge it yourself.
