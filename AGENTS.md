# AGENTS.md

Instructions for Codex and any other coding agent working in this repo.

1. Read `CONTEXT.md` first, then `TASKS.md`, then `docs/ARCHITECTURE.md`, then the prompt you
   were given from `docs/CODEX_PROMPTS.md`. The spec is `docs/PRD.md`. Your tasks are the X rows
   in `TASKS.md`.
2. Your lane is the backend: `server/src/` and its tests. Change only the files your prompt says
   you own: other Codex tasks run at the same time on the other files. Do not change `web/`,
   `shared/protocol.ts` or existing `config.ts` values; if one needs a change, say so in the PR.
3. Node 22.13 or newer is required (the backend uses the built-in `node:sqlite`). Set up with
   `npm ci`. Before opening a PR, `npm run typecheck` and `npm run build` must pass.
4. ETHGlobal rule: add every file you write or change to the file log in `AI_USAGE.md`, with Tool
   set to Codex, in the same PR. Never write or edit the "Not built by AI" section.
5. In `TASKS.md`, put ✅ and the time in IST in the Done column of your X row and update the count
   in Progress. Never add rows for work that did not happen.
6. Thresholds only in `server/src/config.ts`. Every REST call goes through `InfoClient`, which
   charges `WeightBudget`. No new runtime dependencies unless the prompt allows it.
7. Update CURRENT STATE in `CONTEXT.md`. Open a PR and never merge it yourself.
