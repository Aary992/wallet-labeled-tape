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
`/api/health`, one account: `/api/account/<address>`).

Accounts start as **Pending** and get tags as the scorer works through them, biggest traders
first, a few accounts a minute within Hyperliquid's rate limit. Leave it running: scored
accounts are saved in `server/data/tape.db` and reload on restart.

Tests: `npm test`.

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
| `server/src/scoring/` | Queue, scorer loop, round trips, metrics, tags, positions, flow |
| `server/src/db.ts` | SQLite: accounts with metrics, positions, trades (48h) |
| `web/src/` | Vite + React tape UI |
| `docs/PRD.md` | The product spec |
| `docs/ARCHITECTURE.md` | The full design (see Status for what shipped) |
| `docs/RUNBOOK.md` | Demo-night steps: start, check, recover |
| `docs/DEMO.md` | The 3-minute demo script |
| `docs/PRIZES.md` | Partner-prize shortlist |
| `TASKS.md` | Every task, who did it and what is next |
| `AI_USAGE.md` | Where and how AI tools were used (ETHGlobal requirement) |
| `CONTEXT.md`, `CLAUDE.md`, `AGENTS.md` | Working rules for the team and its AI tools |
| `scripts/setup.mjs` | The `npm run setup` script |

## Status

What shipped for the hackathon submission (Sat 2026-11-07):

| Part | State |
|:-|:-|
| Live trades for BTC, ETH, SOL with both addresses | Working |
| Reconnect with backoff | Working. After a gap, positions are flagged until the account is rescored |
| Account scoring: last 30 days of fills rebuilt into round trips; net PnL after fees, return on volume, profit factor, drawdown, weeks positive, maker share | Working |
| Tags on three axes: Profitable / Unprofitable / Mixed (30d), Large, Likely automated / Likely market maker, with history coverage | Working |
| Rate limit: weight budget at 1,000 of 1,200 per minute, biggest trades scored first, bots stopped after one page | Working |
| Position action on every trade of a scored account: open, add, reduce, close, flip | Working |
| Account drawer with every metric, current positions and recent trades | Working |
| Profitable Account Flow per coin (counts accounts, not dollars) with coverage | Working |
| Filters: Profitable only, hide closes, minimum size | Working |
| Forward test (does the tag predict anything?) | Not built. Designed in `docs/ARCHITECTURE.md`; the next step |
| Hourly reconcile against `clearinghouseState`, venue WiFi replay | Not built |

60 tests (`npm test`) run in CI with typecheck and build.

## Honest scope

Tags describe one Hyperliquid account over a stated window, not a person. Hedges on other venues
and other wallets of the same owner are not visible. Labels are heuristics. Not advice.

## License

MIT
