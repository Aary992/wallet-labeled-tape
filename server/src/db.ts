// SQLite storage (PRD: Data model). Uses Node's built-in node:sqlite, so there is no native
// module to compile on Windows. Requires Node 22.13+.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.ts";
import type { TapeRow } from "../../shared/protocol.ts";

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
  last_fill_time     INTEGER
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

  const insertTrade = db.prepare(`
    INSERT OR IGNORE INTO trades (id, time, coin, side, price, size_usd, hash, buyer, seller, buyer_action, seller_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const observeAccount = db.prepare(
    `INSERT OR IGNORE INTO accounts (address, first_observed_at) VALUES (?, ?)`,
  );
  const pruneTrades = db.prepare(`DELETE FROM trades WHERE time < ?`);
  const countScored = db.prepare(`SELECT COUNT(*) AS n FROM accounts WHERE scored_at IS NOT NULL`);

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
  };
}
