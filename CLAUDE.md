# Wallet-Labeled Tape

ETHGlobal Mumbai 2026 hackathon project. **Submissions close Sat 2026-11-07 09:00 IST.**

@CONTEXT.md
@TASKS.md

## Every session

- `git pull` before reading or changing anything; the other machine may have pushed.
- ETHGlobal rule: log every file you write or change in the `AI_USAGE.md` file log, in the same
  commit. Never write or edit its "Not built by AI" section: Aarit writes that.
- `TASKS.md`: move a finished row to Done with Who and When. Never add rows for work that did not
  happen.
- Thresholds live only in `server/src/config.ts`. Every REST call goes through `InfoClient`.
- UI copy says "Profitable (30d)", never "smart money". No em dashes. Unscored accounts show Pending.
- Commit small and often (judges read the history), and push before stopping.

## Commands

| Command | What |
|:-|:-|
| `npm run setup` | Fresh clone: Node check, install, Claude preview entry, API check |
| `npm run dev` | Backend (live Hyperliquid) and web together |
| `npm run dev:fake` | Same with a fake feed, no network needed |
| `npm run probe` | Prints one real trade and one page of fills |
| `npm run typecheck` | Both workspaces |
| `npm run build` | Web production build (CI runs typecheck and build) |

Web runs on 5181, the relay on 8787 (`RELAY_PORT`, never `PORT`). Preview name: `wallet-tape`.
Windows with PowerShell; the laptop has no bash, so npm scripts must not use POSIX-only syntax.
