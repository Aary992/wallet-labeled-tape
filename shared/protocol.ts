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

/** Scoring output for one account (X01 computes it, X05 stores it, the drawer shows it). */
export interface AccountMetrics {
  /** Sum of closed round-trip PnL after fee and builderFee, USD. */
  netPnlUsd: number;
  tradedNotionalUsd: number;
  /** netPnlUsd / tradedNotionalUsd. */
  returnOnVolume: number;
  /** Gross win / gross loss. 999 when there are wins and no losses, null with no closed trips. */
  profitFactor: number | null;
  /** Largest fall in cumulative PnL from a peak, % of that peak. 100 if it never rose above 0. */
  maxDrawdownPct: number;
  weeksPositivePct: number;
  closedPositions: number;
  /** Share of fills with crossed === false, 0 to 1. */
  makerShare: number;
  fillsPerDay: number;
  medianHoldSeconds: number | null;
  medianPositionNotionalUsd: number | null;
  /** Share of covered time with |position| under config flatNotionalUsd, 0 to 1. */
  flatShare: number;
  fillCount: number;
  /** True when the 10,000 reachable fills ran out before the 30 day window did. */
  hitFillCap: boolean;
  coverageStart: number;
  coverageDays: number;
}

/** GET /api/account/:address */
export interface AccountDetail {
  address: string;
  tags: AccountTags;
  /** Null until scored. */
  metrics: AccountMetrics | null;
  firstObservedAt: number | null;
  scoredAt: number | null;
  positions: Array<{ coin: string; size: number; needsReconcile: boolean }>;
  /** Last 20 tape rows this account was on either side of, newest first. */
  recentTrades: TapeRow[];
  explorerUrl: string;
}

export type ForwardTestGroup = "profitable" | "unprofitable" | "random" | "all";

export interface ForwardTestResult {
  group: ForwardTestGroup;
  horizonMinutes: number;
  signals: number;
  /** Share of signals with a positive return after delay and fees, 0 to 100. Null with 0 signals. */
  hitRatePct: number | null;
  /** Average return after delay and fees, basis points. */
  avgReturnBps: number | null;
}

/** GET /api/forward-test. 404 until a cohort is frozen. */
export interface ForwardTestReport {
  cohortId: string;
  frozenAt: number;
  /** sha256 of the committed cohort file: proves the cohort was not edited after T0. */
  cohortSha256: string;
  measuredUntil: number;
  copyDelaySeconds: number;
  roundTripFeeBps: number;
  results: ForwardTestResult[];
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
