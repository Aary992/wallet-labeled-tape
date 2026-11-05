// Wire protocol between the backend relay and the browser.
// Both server/ and web/ import this file, so a change here is a change on both sides.

export type Coin = "BTC" | "ETH" | "SOL";

/** What a trade did to one account's position. "unknown" = the account is not scored yet. */
export type PositionAction = "open" | "add" | "reduce" | "close" | "flip" | "unknown";

/** History axis (PRD, Step 4). "pending" = not fetched yet, shown with a spinner, never a guessed tag. */
export type HistoryState = "pending" | "insufficient" | "partial" | "full";

export type PerfTag = "profitable" | "unprofitable" | "mixed";
export type SizeTag = "large";
export type ActivityTag = "automated" | "market_maker";

/** The three independent axes plus the history state. Null = no tag on that axis. */
export interface AccountTags {
  history: HistoryState;
  perf: PerfTag | null;
  size: SizeTag | null;
  activity: ActivityTag | null;
  /** Days of history actually covered (capped at the 30 day window). */
  coverageDays: number | null;
  /** Finished round trips: the sample size behind the perf tag. */
  closedPositions: number | null;
}

export interface TradeSide {
  address: string;
  tags: AccountTags;
  action: PositionAction;
}

export interface TapeRow {
  /** Hyperliquid trade id (tid). */
  id: number;
  /** Exchange time, ms since epoch. */
  time: number;
  coin: Coin;
  /** Aggressor side: "buy" = the taker bought. */
  side: "buy" | "sell";
  price: number;
  sizeUsd: number;
  hash: string;
  buyer: TradeSide;
  seller: TradeSide;
}

export type ConnectionState = "live" | "reconciling" | "reconnecting";

export interface StatusSnapshot {
  connection: ConnectionState;
  mode: "live" | "fake";
  coins: Coin[];
  tradesSeen: number;
  accountsSeen: number;
  accountsScored: number;
  queueLength: number;
  /** Share of the REST weight budget used in the last minute, 0 to 100. */
  restWeightUsedPct: number;
}

/** Profitable Account Flow (F4), one per coin. Filled by the scorer; null until then. */
export interface FlowSnapshot {
  coin: Coin;
  windowMinutes: number;
  raised: number;
  cut: number;
  /** Share of observed notional from scored accounts, 0 to 100. */
  coveragePct: number;
}

export type ServerMessage =
  | { type: "hello"; status: StatusSnapshot; backlog: TapeRow[] }
  | { type: "trades"; rows: TapeRow[] }
  | { type: "status"; status: StatusSnapshot }
  | { type: "flow"; flow: FlowSnapshot[] };

export const PENDING_TAGS: AccountTags = {
  history: "pending",
  perf: null,
  size: null,
  activity: null,
  coverageDays: null,
  closedPositions: null,
};
