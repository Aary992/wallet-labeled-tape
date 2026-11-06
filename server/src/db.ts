// SQLite storage (PRD: Data model). Uses Node's built-in node:sqlite, so there is no native
// module to compile on Windows. Requires Node 22.13+.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.ts";
import type { AccountMetrics, AccountTags, TapeRow } from "../../shared/protocol.ts";
import type { ScoredAccount } from "./scoring/scorer.ts";
import type { PositionEntry } from "./scoring/positions.ts";

export interface StoredTrade {
  id: number; time: number; coin: string; side: string; price: number; size_usd: number; hash: string;
  buyer: string; seller: string; buyer_action: string; seller_action: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  address            TEXT PRIMARY KEY,
  history_state      TEXT NOT NULL DEFAULT 'pending',
  perf_tag           TEXT,
  size_tag           TEXT,
  activity_tag       TEXT,
  net_pnl_usd        REAL,
  return_on_volume   REAL,
  profit_factor      REAL,
  max_drawdown_pct   REAL,
  weeks_positive_pct REAL,
  closed_positions   INTEGER,
  maker_share        REAL,
  coverage_start     INTEGER,
  coverage_days      REAL,
  first_observed_at  INTEGER NOT NULL,
  scored_at          INTEGER,
  expires_at         INTEGER,
  last_fill_time     INTEGER,
  metrics_json       TEXT
);

CREATE TABLE IF NOT EXISTS positions (
  address         TEXT NOT NULL,
  coin            TEXT NOT NULL,
  size            REAL NOT NULL,
  avg_entry       REAL,
  updated_at      INTEGER NOT NULL,
  needs_reconcile INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (address, coin)
);

CREATE TABLE IF NOT EXISTS trades (
  id            INTEGER PRIMARY KEY,
  time          INTEGER NOT NULL,
  coin          TEXT NOT NULL,
  side          TEXT NOT NULL,
  price         REAL NOT NULL,
  size_usd      REAL NOT NULL,
  hash          TEXT NOT NULL,
  buyer         TEXT NOT NULL,
  seller        TEXT NOT NULL,
  buyer_action  TEXT NOT NULL DEFAULT 'unknown',
  seller_action TEXT NOT NULL DEFAULT 'unknown'
);
CREATE INDEX IF NOT EXISTS trades_time ON trades (time);
CREATE INDEX IF NOT EXISTS trades_buyer ON trades (buyer, time);
CREATE INDEX IF NOT EXISTS trades_seller ON trades (seller, time);

CREATE TABLE IF NOT EXISTS cohorts (
  cohort_id          TEXT NOT NULL,
  frozen_at          INTEGER NOT NULL,
  address            TEXT NOT NULL,
  perf_tag_at_freeze TEXT,
  PRIMARY KEY (cohort_id, address)
);
`;

export type Db = ReturnType<typeof openDb>;

export function openDb(path: string = config.dbPath) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
  db.exec(SCHEMA);
  // Databases created before the scorer existed lack this column.
  const cols = db.prepare("PRAGMA table_info(accounts)").all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "metrics_json")) db.exec("ALTER TABLE accounts ADD COLUMN metrics_json TEXT");

  const insertTrade = db.prepare(`
    INSERT OR IGNORE INTO trades (id, time, coin, side, price, size_usd, hash, buyer, seller, buyer_action, seller_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const observeAccount = db.prepare(
    `INSERT OR IGNORE INTO accounts (address, first_observed_at) VALUES (?, ?)`,
  );
  const pruneTrades = db.prepare(`DELETE FROM trades WHERE time < ?`);
  const countScored = db.prepare(`SELECT COUNT(*) AS n FROM accounts WHERE scored_at IS NOT NULL`);
  const upsertScored = db.prepare(`
    INSERT INTO accounts (address, first_observed_at, history_state, perf_tag, size_tag, activity_tag,
      net_pnl_usd, return_on_volume, profit_factor, max_drawdown_pct, weeks_positive_pct, closed_positions,
      maker_share, coverage_start, coverage_days, scored_at, expires_at, last_fill_time, metrics_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET history_state = excluded.history_state, perf_tag = excluded.perf_tag,
      size_tag = excluded.size_tag, activity_tag = excluded.activity_tag, net_pnl_usd = excluded.net_pnl_usd,
      return_on_volume = excluded.return_on_volume, profit_factor = excluded.profit_factor,
      max_drawdown_pct = excluded.max_drawdown_pct, weeks_positive_pct = excluded.weeks_positive_pct,
      closed_positions = excluded.closed_positions, maker_share = excluded.maker_share,
      coverage_start = excluded.coverage_start, coverage_days = excluded.coverage_days,
      scored_at = excluded.scored_at, expires_at = excluded.expires_at,
      last_fill_time = excluded.last_fill_time, metrics_json = excluded.metrics_json`);
  const selectScored = db.prepare(
    `SELECT address, history_state, perf_tag, size_tag, activity_tag, metrics_json, scored_at, expires_at, last_fill_time
     FROM accounts WHERE scored_at IS NOT NULL AND metrics_json IS NOT NULL`,
  );
  const selectAccount = db.prepare(`SELECT first_observed_at, scored_at FROM accounts WHERE address = ?`);
  const selectTradesFor = db.prepare(
    `SELECT * FROM trades WHERE buyer = ? OR seller = ? ORDER BY time DESC LIMIT 20`,
  );
  const upsertPosition = db.prepare(`
    INSERT INTO positions (address, coin, size, updated_at, needs_reconcile) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(address, coin) DO UPDATE SET size = excluded.size, updated_at = excluded.updated_at,
      needs_reconcile = excluded.needs_reconcile`);
  const selectPositions = db.prepare(`SELECT address, coin, size, updated_at, needs_reconcile FROM positions`);

  return {
    raw: db,
    saveTrade(row: TapeRow): void {
      insertTrade.run(
        row.id, row.time, row.coin, row.side, row.price, row.sizeUsd, row.hash,
        row.buyer.address, row.seller.address, row.buyer.action, row.seller.action,
      );
    },
    observeAccount(address: string, at: number): void {
      observeAccount.run(address, at);
    },
    pruneOldTrades(): void {
      pruneTrades.run(Date.now() - config.storage.tradeRetentionHours * 3_600_000);
    },
    scoredCount(): number {
      return Number((countScored.get() as { n: number }).n);
    },
    saveScored(s: ScoredAccount): void {
      const m = s.metrics;
      upsertScored.run(
        s.address, s.scoredAt, s.tags.history, s.tags.perf, s.tags.size, s.tags.activity,
        m.netPnlUsd, m.returnOnVolume, m.profitFactor, m.maxDrawdownPct, m.weeksPositivePct, m.closedPositions,
        m.makerShare, m.coverageStart, m.coverageDays, s.scoredAt, s.expiresAt, s.lastFillTime, JSON.stringify(m),
      );
    },
    /** Every scored account, so a restart starts warm. */
    loadScored(): ScoredAccount[] {
      return (selectScored.all() as Array<Record<string, unknown>>).map((r) => {
        const metrics = JSON.parse(String(r.metrics_json)) as AccountMetrics;
        const tags: AccountTags = {
          history: r.history_state as AccountTags["history"],
          perf: (r.perf_tag as AccountTags["perf"]) ?? null,
          size: (r.size_tag as AccountTags["size"]) ?? null,
          activity: (r.activity_tag as AccountTags["activity"]) ?? null,
          coverageDays: metrics.coverageDays,
          closedPositions: metrics.closedPositions,
        };
        return {
          address: String(r.address), tags, metrics,
          scoredAt: Number(r.scored_at), expiresAt: Number(r.expires_at),
          lastFillTime: r.last_fill_time === null ? null : Number(r.last_fill_time),
        };
      });
    },
    accountTimes(address: string): { firstObservedAt: number | null; scoredAt: number | null } {
      const r = selectAccount.get(address) as { first_observed_at: number; scored_at: number | null } | undefined;
      return { firstObservedAt: r?.first_observed_at ?? null, scoredAt: r?.scored_at ?? null };
    },
    recentTradesFor(address: string): StoredTrade[] {
      return selectTradesFor.all(address, address) as unknown as StoredTrade[];
    },
    savePositions(entries: PositionEntry[]): void {
      db.exec("BEGIN");
      try {
        for (const p of entries) upsertPosition.run(p.address, p.coin, p.size, p.updatedAt, p.needsReconcile ? 1 : 0);
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    },
    loadPositions(): PositionEntry[] {
      return (selectPositions.all() as Array<Record<string, unknown>>).map((r) => ({
        address: String(r.address), coin: String(r.coin), size: Number(r.size),
        updatedAt: Number(r.updated_at), needsReconcile: Number(r.needs_reconcile) === 1,
      }));
    },
  };
}
