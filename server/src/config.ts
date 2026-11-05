// Every threshold from the PRD lives here, in one file, so hour-0 API checks and demo tuning
// never mean hunting through code. Values marked "confirm" come from memory of Hyperliquid's
// docs and must be checked against https://hyperliquid.gitbook.io/hyperliquid-docs.

import type { Coin } from "../../shared/protocol.ts";

const env = process.env;

export const config = {
  // RELAY_PORT, not PORT: dev tools inject PORT for the web server and the two would collide.
  port: Number(env.RELAY_PORT ?? 8787),
  fake: env.FAKE === "1" || process.argv.includes("--fake"),
  coins: (env.COINS ?? "BTC,ETH,SOL").split(",").map((c) => c.trim().toUpperCase()) as Coin[],
  dbPath: env.DB_PATH ?? "data/tape.db",

  hyperliquid: {
    wsUrl: "wss://api.hyperliquid.xyz/ws",
    infoUrl: "https://api.hyperliquid.xyz/info",
    explorerAddressUrl: "https://app.hyperliquid.xyz/explorer/address/",
    /** Send a ping this often so the socket is never idle (confirm idle timeout, ~60 s). */
    pingIntervalMs: 30_000,
    reconnectBackoffMs: [500, 1_000, 2_000, 5_000, 10_000],
  },

  /** REST budget (PRD: rate limits). Confirm: 1,200 weight per minute per IP. */
  budget: {
    restWeightPerMinute: 1_200,
    scorerWeightPerMinute: 1_000,
    /** Confirm: userFillsByTime base weight and the extra weight per returned item. */
    userFillsBaseWeight: 20,
    userFillsWeightPer20Items: 1,
    clearinghouseStateWeight: 2,
  },

  /** History caps (confirm): 2,000 fills per call, only the 10,000 most recent are reachable. */
  fills: {
    maxPerCall: 2_000,
    maxReachable: 10_000,
  },

  queue: {
    maxWaiting: 500,
    minNotionalUsd: 5_000,
  },

  scoring: {
    windowDays: 30,
    /** Below either of these: "Insufficient history", no performance tag. */
    minClosedPositions: 20,
    minCoverageDays: 7,
    /** 7 to 29 days covered: "Partial history", tag shown with "covers N days". */
    fullCoverageDays: 30,

    profitable: {
      minNetPnlUsd: 0, // strictly greater than
      minProfitFactor: 1.3,
      minReturnOnVolume: 0.0005, // 0.05%
      maxDrawdownPct: 50,
      minWeeksPositivePct: 60,
    },
    unprofitable: {
      maxNetPnlUsd: 0, // strictly less than
      maxProfitFactor: 0.8, // strictly less than
    },
    large: {
      minMedianPositionNotionalUsd: 250_000, // strictly greater than
    },
    automated: {
      minFillsPerDay: 500,
      maxMedianHoldSeconds: 60, // strictly less than
    },
    marketMaker: {
      minMakerShare: 0.8,
      /** "Near flat most of the time": share of time with |position| under this notional. */
      flatNotionalUsd: 10_000,
      minFlatShare: 0.7,
    },
  },

  freshness: {
    activeCohortTtlMs: 60 * 60 * 1000,
    otherTtlMs: 6 * 60 * 60 * 1000,
    reconcileEveryMs: 60 * 60 * 1000,
  },

  flow: {
    windowMinutes: 15,
  },

  storage: {
    tradeRetentionHours: 48,
    tapeBacklogRows: 300,
  },

  forwardTest: {
    copyDelaySeconds: 10,
    horizonsMinutes: [15, 60, 240],
    /** Confirm the current taker fee tier for a fresh account. */
    takerFeeBps: 4.5,
  },
} as const;

export type Config = typeof config;
