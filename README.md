# Wallet-Labeled Tape

A live Hyperliquid trade feed that shows **which account is on each side of a trade** and **what the
trade did to that account's position** (open, add, reduce, close, flip). Each account carries
separate tags for size, activity and 30-day performance, with the sample size and history coverage
shown next to every tag.

Built at **ETHGlobal Mumbai 2026** (Nov 5 to 7), From Scratch track.

## Why this needs an open chain

Order flow tools show size, side and price, but every print is anonymous. Hyperliquid publishes
both wallet addresses on every fill through a free public API. A centralized exchange never exposes
this, so this product cannot be built on Binance-style data.

## Run it

Needs Node 22.13 or newer. No API keys, no accounts, ₹0.

```bash
git clone https://github.com/Aary992/wallet-labeled-tape.git
cd wallet-labeled-tape
npm run setup
```

`npm run setup` checks Node, installs packages and checks the Hyperliquid API. It also adds a
preview entry for Claude Code; skip that with `npm run setup -- --no-claude`.

```bash
npm run dev
```

Open http://localhost:5181. The backend relay runs on http://localhost:8787 (health:
`/api/health`).

Offline UI work with a fake feed and random tags:

```bash
npm run dev:fake
```

Hour-0 API check (prints a real trade and a page of fills):

```bash
npm run probe
```

## Layout

| Path | What |
|:-|:-|
| `shared/protocol.ts` | Wire types between backend and browser |
| `server/src/config.ts` | Every threshold from the PRD, one file |
| `server/src/hl/` | Hyperliquid stream (reconnect, ping), REST client, weight budget |
| `server/src/scoring/` | Priority queue (done) and the labeling rules (open work, see its README) |
| `server/src/db.ts` | SQLite schema: accounts, positions, trades (48h), cohorts |
| `web/src/` | Vite + React tape UI |
| `docs/PRD.md` | The product spec |
| `TASKS.md` | Every task, who did it and what is next |
| `AI_USAGE.md` | Where and how AI tools were used (ETHGlobal requirement) |
| `CONTEXT.md`, `CLAUDE.md`, `AGENTS.md` | Working rules for the team and its AI tools |
| `scripts/setup.mjs` | The `npm run setup` script |

## Status

| Part | State |
|:-|:-|
| Live trades for BTC, ETH, SOL with both addresses | Working |
| Reconnect with backoff, gap event | Working (backfill TODO) |
| SQLite storage, 48h trade retention | Working |
| Tape UI with filters and account drawer shell | Working |
| Account scoring and tags | TODO |
| Position actions per trade | TODO |
| Profitable Account Flow | TODO |
| Forward test | TODO |

## Honest scope

Tags describe one Hyperliquid account over a stated window, not a person. Hedges on other venues
and other wallets of the same owner are not visible. Labels are heuristics. Not advice.

## License

MIT
