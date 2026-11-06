// Profitable Account Flow (PRD F4): per coin over a rolling window, how many profitable accounts
// raised vs cut long exposure. Each account counts once, by the sign of its net change, so both
// sides of one trade never double-count and one whale counts as one.

import { config } from "../config.ts";
import type { Coin, FlowSnapshot } from "../../../shared/protocol.ts";

export interface FlowEvent {
  time: number;
  coin: Coin;
  address: string;
  /** Signed change in long exposure, USD: + bought, - sold. */
  signedNotionalUsd: number;
  sizeUsd: number;
  scored: boolean;
  profitable: boolean;
}

export class FlowTracker {
  private events: FlowEvent[] = [];

  record(e: FlowEvent): void {
    this.events.push(e);
  }

  snapshot(coins: readonly Coin[], now = Date.now()): FlowSnapshot[] {
    const windowMs = config.flow.windowMinutes * 60_000;
    this.events = this.events.filter((e) => e.time >= now - windowMs);
    return coins.map((coin) => {
      const net = new Map<string, number>();
      let total = 0;
      let scored = 0;
      for (const e of this.events) {
        if (e.coin !== coin) continue;
        total += e.sizeUsd;
        if (e.scored) scored += e.sizeUsd;
        if (e.profitable) net.set(e.address, (net.get(e.address) ?? 0) + e.signedNotionalUsd);
      }
      let raised = 0;
      let cut = 0;
      for (const v of net.values()) {
        if (v > 0) raised += 1;
        else if (v < 0) cut += 1;
      }
      return {
        coin,
        windowMinutes: config.flow.windowMinutes,
        raised,
        cut,
        coveragePct: total > 0 ? (scored / total) * 100 : 0,
      };
    });
  }
}
