// Entry point: Hyperliquid trades -> account book -> SQLite + browser relay.
// PRD flow: a trade arrives, both accounts are looked up, positions update, the trade's position
// action is tagged and sent to the browser. Unscored accounts go into the queue and show "Pending".

import { config } from "./config.ts";
import { openDb } from "./db.ts";
import { AccountBook } from "./accounts.ts";
import { Relay } from "./relay.ts";
import { TradeStream } from "./hl/stream.ts";
import { FakeStream, fakeTagsFor } from "./fake.ts";
import { WeightBudget } from "./hl/budget.ts";
import { ScoreQueue } from "./scoring/queue.ts";
import type { HlWsTrade } from "./hl/types.ts";
import type { Coin, ConnectionState, StatusSnapshot, TapeRow } from "../../shared/protocol.ts";

const db = openDb();
const book = new AccountBook();
const queue = new ScoreQueue();
const budget = new WeightBudget();
let connection: ConnectionState = "reconnecting";
let tradesSeen = 0;

const status = (): StatusSnapshot => ({
  connection,
  mode: config.fake ? "fake" : "live",
  coins: config.coins,
  tradesSeen,
  accountsSeen: book.seenCount,
  accountsScored: book.scoredCount,
  queueLength: queue.size,
  restWeightUsedPct: budget.usedPct(),
});

const relay = new Relay(status);

function toRow(t: HlWsTrade): TapeRow {
  const [buyer, seller] = t.users;
  const price = Number(t.px);
  const size = Number(t.sz);
  const sizeUsd = price * size;
  for (const address of t.users) {
    if (book.observe(address, t.time)) {
      db.observeAccount(address, t.time);
      if (config.fake) book.setTags(address, fakeTagsFor(address));
    }
    if (book.tagsFor(address).history === "pending") queue.offer(address, sizeUsd, t.time);
  }
  return {
    id: t.tid,
    time: t.time,
    coin: t.coin as Coin,
    side: t.side === "B" ? "buy" : "sell",
    price,
    sizeUsd,
    hash: t.hash,
    buyer: { address: buyer, tags: book.tagsFor(buyer), action: book.actionFor(buyer, t.coin, size) },
    seller: { address: seller, tags: book.tagsFor(seller), action: book.actionFor(seller, t.coin, -size) },
  };
}

const stream = config.fake ? new FakeStream(config.coins) : new TradeStream(config.coins);

stream.on("trades", (trades) => {
  const rows = trades.map(toRow);
  tradesSeen += rows.length;
  for (const row of rows) db.saveTrade(row);
  relay.pushTrades(rows);
});

stream.on("state", (state) => {
  connection = state;
  console.log(`[stream] ${state}`);
  relay.broadcast({ type: "status", status: status() });
});

stream.on("gap", ({ since }) => {
  // TODO(positions.ts): refetch recent fills for active accounts and mark positions needs_reconcile.
  console.log(`[stream] reconnected, gap since ${new Date(since).toISOString()}`);
});

setInterval(() => relay.broadcast({ type: "status", status: status() }), 1_000);
setInterval(() => db.pruneOldTrades(), 10 * 60_000);

stream.start();
console.log(`[tape] ${config.fake ? "FAKE feed" : "Hyperliquid live"} for ${config.coins.join(", ")}`);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    stream.stop();
    db.raw.close();
    process.exit(0);
  });
}
