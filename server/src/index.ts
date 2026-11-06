// Entry point: Hyperliquid trades -> account book -> SQLite + browser relay.
// A trade arrives, both accounts are looked up, positions update, the trade's position action is
// tagged and sent to the browser. Unscored accounts go into the queue and show "Pending" until the
// scorer has fetched and scored their last 30 days.

import { config } from "./config.ts";
import { openDb, type StoredTrade } from "./db.ts";
import { AccountBook } from "./accounts.ts";
import { Relay } from "./relay.ts";
import { TradeStream } from "./hl/stream.ts";
import { InfoClient } from "./hl/info.ts";
import { FakeStream, fakeMetricsFor, fakeTagsFor } from "./fake.ts";
import { WeightBudget } from "./hl/budget.ts";
import { ScoreQueue } from "./scoring/queue.ts";
import { Scorer, type ScoredAccount } from "./scoring/scorer.ts";
import { PositionBook } from "./scoring/positions.ts";
import { FlowTracker } from "./scoring/flow.ts";
import type { HlWsTrade } from "./hl/types.ts";
import type {
  AccountDetail,
  Coin,
  ConnectionState,
  PositionAction,
  StatusSnapshot,
  TapeRow,
} from "../../shared/protocol.ts";

const db = openDb();
const book = new AccountBook();
const queue = new ScoreQueue();
const budget = new WeightBudget();
const positions = new PositionBook();
const flow = new FlowTracker();
let connection: ConnectionState = "reconnecting";
let tradesSeen = 0;

// Start warm: every account scored on an earlier run keeps its tags, metrics and positions.
if (!config.fake) {
  const stored = db.loadScored();
  for (const s of stored) book.setTags(s.address, s.tags, s.metrics, s.expiresAt);
  for (const p of db.loadPositions()) positions.seed(p.address, p.coin, p.size, p.updatedAt);
  if (stored.length) console.log(`[tape] loaded ${stored.length} scored accounts from ${config.dbPath}`);
}

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

function lookupAccount(address: string): AccountDetail | null {
  if (!book.isSeen(address)) return null;
  const times = db.accountTimes(address);
  const metrics = config.fake ? fakeMetricsFor(address) : book.metricsFor(address);
  return {
    address,
    tags: book.tagsFor(address),
    metrics,
    firstObservedAt: times.firstObservedAt,
    scoredAt: config.fake ? (metrics ? Date.now() - 600_000 : null) : times.scoredAt,
    positions: positions
      .entries()
      .filter((p) => p.address === address && p.size !== 0)
      .map((p) => ({ coin: p.coin, size: p.size, needsReconcile: p.needsReconcile })),
    recentTrades: db.recentTradesFor(address).map(fromStored),
    explorerUrl: `${config.hyperliquid.explorerAddressUrl}${address}`,
  };
}

const relay = new Relay(status, lookupAccount);

function fromStored(t: StoredTrade): TapeRow {
  return {
    id: t.id,
    time: t.time,
    coin: t.coin as Coin,
    side: t.side as TapeRow["side"],
    price: t.price,
    sizeUsd: t.size_usd,
    hash: t.hash,
    buyer: { address: t.buyer, tags: book.tagsFor(t.buyer), action: t.buyer_action as PositionAction },
    seller: { address: t.seller, tags: book.tagsFor(t.seller), action: t.seller_action as PositionAction },
  };
}

function onScored(s: ScoredAccount): void {
  book.setTags(s.address, s.tags, s.metrics, s.expiresAt);
  db.saveScored(s);
}

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
    const pending = book.tagsFor(address).history === "pending";
    if (!config.fake && (pending || book.isExpired(address, t.time))) queue.offer(address, sizeUsd, t.time);
  }
  const actionFor = (address: string, signed: number): PositionAction =>
    positions.isSeeded(address) ? positions.apply(address, t.coin, signed, t.time) : "unknown";
  const row: TapeRow = {
    id: t.tid,
    time: t.time,
    coin: t.coin as Coin,
    side: t.side === "B" ? "buy" : "sell",
    price,
    sizeUsd,
    hash: t.hash,
    buyer: { address: buyer, tags: book.tagsFor(buyer), action: actionFor(buyer, size) },
    seller: { address: seller, tags: book.tagsFor(seller), action: actionFor(seller, -size) },
  };
  for (const [side, signed] of [[row.buyer, sizeUsd], [row.seller, -sizeUsd]] as const) {
    flow.record({
      time: t.time,
      coin: row.coin,
      address: side.address,
      signedNotionalUsd: signed,
      sizeUsd,
      scored: side.tags.history !== "pending",
      profitable: side.tags.perf === "profitable" && side.tags.activity !== "market_maker",
    });
  }
  return row;
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
  // Trades missed while disconnected can leave positions off; flag them until rescored.
  positions.markNeedsReconcile();
  console.log(`[stream] reconnected, gap since ${new Date(since).toISOString()}`);
});

const scorer = new Scorer(queue, new InfoClient(budget), positions, onScored);
if (!config.fake) scorer.start();

setInterval(() => relay.broadcast({ type: "status", status: status() }), 1_000);
setInterval(() => relay.broadcast({ type: "flow", flow: flow.snapshot(config.coins) }), config.flow.broadcastEveryMs);
setInterval(() => db.pruneOldTrades(), 10 * 60_000);
if (!config.fake) setInterval(() => db.savePositions(positions.entries()), config.positions.persistEveryMs);

stream.start();
console.log(`[tape] ${config.fake ? "FAKE feed" : "Hyperliquid live"} for ${config.coins.join(", ")}`);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    scorer.stop();
    stream.stop();
    if (!config.fake) db.savePositions(positions.entries());
    db.raw.close();
    process.exit(0);
  });
}
