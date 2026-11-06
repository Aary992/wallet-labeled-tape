# ETHGlobal submission: field by field

Draft text for the ETHGlobal Mumbai project form (ethglobal.com/events/mumbai/project). Aarit
edits it into his own words before pasting. Rule from the form: you can update after submitting,
so submit early and improve.

## Project details

| Field | Value |
|:-|:-|
| Project name | Wallet-Labeled Tape |
| Category | Wallet/Payments does not fit well. Better: **DeFi** (or "Infrastructure" / "Data" if listed) |
| Emoji | 🏷️ |
| Demo link | The hosted URL from `docs/DEPLOY.md` (Render). If hosting fails, the YouTube link of the demo video |
| GitHub | Aary992 / wallet-labeled-tape |

### Short description (100 characters max)

> Live Hyperliquid trade tape that names both wallets on every trade and tags them by 30-day results

(98 characters.)

### Description (280 characters min)

> Order flow tools show you what traded. Wallet-Labeled Tape shows you who traded. Hyperliquid
> publishes both wallet addresses on every trade, so we stream the live BTC, ETH and SOL tape and
> label each side: Profitable, Unprofitable or Mixed over the last 30 days, Large, Likely automated
> or Likely market maker, with the sample size and days covered next to every tag. Each trade also
> says what it did to that wallet's position: open, add, reduce, close or flip. Filters cut the
> noise to "profitable accounts opening in size". Click any address for its full record: net PnL
> after fees, return on volume, profit factor, max drawdown, weeks positive, maker share, open
> positions and recent trades. A flow panel counts how many profitable accounts raised or cut
> exposure per coin in the last 15 minutes, counting accounts, not dollars, so one whale cannot fake
> it. Binance cannot offer this because its prints are anonymous. Not advice: tags describe the
> past, and unscored accounts say Pending instead of guessing.

### How it's made (280 characters min)

> TypeScript end to end, Node 22 and React. The backend opens Hyperliquid's public WebSocket trade
> stream for BTC, ETH and SOL (every trade carries both user addresses) with reconnect and backoff.
> Each new address joins a priority queue ranked by notional size and recency. A scorer pulls the
> account's last 30 days of fills through the REST API and rebuilds them into round trips, then
> computes net PnL after fees (including the builder fee we found while probing the API),
> drawdown, profit factor and maker share, and assigns tags. Hyperliquid allows 1,200 weight per
> minute, so every REST call goes through our own weight-based token bucket capped at 1,000, the
> biggest traders are scored first, and accounts that look like bots stop after one page of
> fills. A position tracker replays each scored account's fills so every live trade gets its
> action (open, add, reduce, close, flip). State lives in Node's built-in SQLite (node:sqlite, no
> native build), so a restart reloads every score. One small relay serves the web app, a WebSocket
> for the tape and a JSON endpoint for the account drawer. The frontend is React and Vite with no
> UI library. 60 unit tests run in GitHub Actions with typecheck and build. Zero cost: no API keys,
> no paid services. AI use is logged file by file in AI_USAGE.md.

## Images

Use `docs/screenshots/01-tape.png`, `02-drawer.png`, `03-btc-opens.png` (taken Fri 23:31 with 65 accounts scored; retake on the demo laptop Saturday morning when far more are scored and some are Profitable).

## Tech stack

TypeScript, Node.js 22, React, Vite, WebSocket (ws), SQLite (node:sqlite), Hyperliquid API,
GitHub Actions. No partner technology unless a prize below is added.

## Track and prizes

No partner integration is built, so the honest options are:

| Prize | Fit | Extra work |
|:-|:-|:-|
| Ethereum Foundation: Best CROPS App | Open source, runs locally, no accounts, no trackers, no API keys, every tag shows its sample | A README section titled CROPS (draft below). About 15 minutes. Weakest-fit warning in `docs/PRIZES.md` still stands |
| Arkiv, Hedera | Both were tied to the forward-test cohort, which was cut | 2 to 3 hours each plus testnet sign-ups. Not recommended tonight |

Recommendation: submit to the main From Scratch track and add EF CROPS only. Aarit's call.

### CROPS draft (paste into README only if EF is picked)

> **Censorship resistant:** reads Hyperliquid's public API directly; no server of ours sits between
> a user and the data, anyone can run it.
> **Open source:** MIT, every line in this repo, AI use logged per file.
> **Private:** no accounts, no logins, no analytics, no cookies; nothing about the viewer leaves
> the machine.
> **Secure:** no keys, no wallets connected, no transactions: read-only by design.

## Video

Script: `docs/DEMO.md`. Under 4 minutes, real speed (sped-up video is disqualified).

## AI disclosure

Point judges at `AI_USAGE.md` and `TASKS.md`. Aarit writes the "Not built by AI" section before
submitting.
