// Hyperliquid wire types. Field names are from memory of the docs: `npm run probe` prints real
// messages so these can be confirmed in hour 0.

/** One element of a `trades` channel message. */
export interface HlWsTrade {
  coin: string;
  /** "B" = the taker bought (bid side aggressed), "A" = the taker sold. */
  side: "A" | "B";
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
  /** [buyer, seller] */
  users: [string, string];
}

export type HlWsMessage =
  | { channel: "trades"; data: HlWsTrade[] }
  | { channel: "subscriptionResponse"; data: unknown }
  | { channel: "pong" }
  | { channel: "error"; data: string }
  | { channel: string; data?: unknown };

/** One fill from `userFills` / `userFillsByTime`. */
export interface HlFill {
  coin: string;
  px: string;
  sz: string;
  side: "A" | "B";
  time: number;
  /** Position size before this fill, signed (long positive). */
  startPosition: string;
  /** e.g. "Open Long", "Close Short", "Long > Short" */
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  /** true = this fill took liquidity (taker). Maker share = share of fills with crossed === false. */
  crossed: boolean;
  fee: string;
  /** Confirmed live 2026-11-06: fills through a builder (front end) carry an extra fee. Net PnL must subtract fee + builderFee. */
  builderFee?: string;
  tid: number;
  feeToken?: string;
  cloid?: string | null;
  twapId?: number | null;
}
// Confirmed live 2026-11-06 with `npm run probe`: trades carry coin, side, px, sz, time, hash, tid,
// users [buyer, seller]; userFillsByTime returns fills OLDEST FIRST.

/** Subset of `clearinghouseState` used to reconcile positions. */
export interface HlClearinghouseState {
  assetPositions: Array<{
    position: {
      coin: string;
      /** Signed size. */
      szi: string;
      entryPx: string | null;
      positionValue: string;
      liquidationPx: string | null;
    };
  }>;
  time: number;
}
