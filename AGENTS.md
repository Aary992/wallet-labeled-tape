# AGENTS.md

Instructions for Codex and any other coding agent working in this repo.

1. Read `CONTEXT.md` first, then `TASKS.md`, then `docs/ARCHITECTURE.md`, then the prompt you
   were given from `docs/CODEX_PROMPTS.md`. The spec is `docs/PRD.md`. Your tasks are the X rows
   in `TASKS.md`.
2. Your lane is the backend: `server/src/` and its tests. Change only the files your prompt says
   you own: another Codex task runs at the same time on other files. Do not change `web/`,
   `shared/protocol.ts` or existing `config.ts` values; if one needs a change, say so in the PR.
3. Node 22.13 or newer is required (the backend uses the built-in `node:sqlite`). Set up with
   `npm ci`. Before opening a PR, `npm run typecheck`, `npm run build` and `npm test` must pass.
4. ETHGlobal rule: every file you write or change must be logged. Two Codex PRs run at the same
   time, so do NOT edit `AI_USAGE.md`, `TASKS.md` or `CONTEXT.md` (their log lines would
   conflict). Instead, list every file you changed, with one line on what you did, in the PR
   description. Claude adds those rows to the logs right after Aarit merges.
5. Thresholds only in `server/src/config.ts`. Every REST call goes through `InfoClient`, which
   charges `WeightBudget`. No new runtime dependencies unless the prompt allows it.
6. Work in your own git worktree on a new branch cut from the latest `origin/main`
   (`git fetch origin` then `git worktree add <your scratch folder> -b codex/<task> origin/main`).
   Never switch branches in `C:UsersAaruDocumentswallet-labeled-tape` or any folder you did
   not create: another Codex task and Claude work on this machine at the same time.
7. Open a PR and never merge it yourself.
