// Fake trade feed for offline UI work (`npm run dev:fake`). Same events as TradeStream, plus
// random tags so every chip, filter and state in the UI can be built before the scorer exists.

import { EventEmitter } from "node:events";
import type { AccountMetrics, AccountTags } from "../../shared/protocol.ts";
import type { TradeStreamEvents } from "./hl/stream.ts";
import type { HlWsTrade } from "./hl/types.ts";

const PRICES: Record<string, number> = { BTC: 102_000, ETH: 3_400, SOL: 160 };

const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const POOL = Array.from({ length: 60 }, () => `0x${hex(40)}`);

export function fakeTagsFor(address: string): AccountTags {
  // Deterministic per address so an account keeps its tags for the whole session.
  const seed = parseInt(address.slice(2, 10), 16);
  const pick = <T>(arr: T[], salt: number): T => arr[(seed + salt) % arr.length] as T;
  const history = pick(["pending", "insufficient", "partial", "full", "full", "full"] as const, 1);
  const scored = history === "partial" || history === "full";
  return {
    history,
    perf: scored ? pick(["profitable", "unprofitable", "mixed", "mixed"] as const, 2) : null,
    size: pick([null, null, "large"] as const, 3),
    activity: pick([null, null, null, "automated", "market_maker"] as const, 4),
    coverageDays: scored ? (history === "full" ? 30 : 7 + (seed % 23)) : null,
    closedPositions: scored ? 20 + (seed % 180) : null,
  };
}

/** Believable metrics that match fakeTagsFor, so the drawer can be built offline. */
export function fakeMetricsFor(address: string): AccountMetrics | null {
  const t = fakeTagsFor(address);
  if (t.history === "pending") return null;
  const seed = parseInt(address.slice(10, 18), 16);
  const r = (salt: number) => ((seed * (salt + 7)) % 1000) / 1000;
  const sign = t.perf === "profitable" ? 1 : t.perf === "unprofitable" ? -1 : r(1) > 0.5 ? 1 : -1;
  const volume = 2e6 + r(2) * 60e6;
  const days = t.coverageDays ?? 3 + r(3) * 3;
  return {
    netPnlUsd: sign * volume * (0.0006 + r(4) * 0.004),
    tradedNotionalUsd: volume,
    returnOnVolume: sign * (0.0006 + r(4) * 0.004),
    profitFactor: t.perf === "profitable" ? 1.3 + r(5) * 1.5 : t.perf === "unprofitable" ? 0.3 + r(5) * 0.4 : 0.9 + r(5) * 0.3,
    maxDrawdownPct: t.perf === "profitable" ? 8 + r(6) * 35 : 40 + r(6) * 120,
    weeksPositivePct: t.perf === "profitable" ? 60 + r(7) * 40 : r(7) * 55,
    closedPositions: t.closedPositions ?? 5 + Math.floor(r(8) * 14),
    makerShare: t.activity === "market_maker" ? 0.85 + r(9) * 0.15 : r(9) * 0.6,
    fillsPerDay: t.activity === "automated" ? 600 + r(10) * 4000 : 5 + r(10) * 150,
    medianHoldSeconds: t.activity === "automated" ? 5 + r(11) * 50 : 600 + r(11) * 40_000,
    medianPositionNotionalUsd: t.size === "large" ? 260_000 + r(12) * 900_000 : 2_000 + r(12) * 200_000,
    flatShare: t.activity === "market_maker" ? 0.75 + r(13) * 0.25 : r(13) * 0.5,
    fillCount: Math.floor(days * (t.activity === "automated" ? 1500 : 60)),
    hitFillCap: t.activity === "automated",
    coverageStart: Date.now() - days * 86_400_000,
    coverageDays: days,
  };
}

export class FakeStream extends EventEmitter<TradeStreamEvents> {
  private timer: NodeJS.Timeout | null = null;
  private tid = 1;

  constructor(private readonly coins: readonly string[]) {
    super();
  }

  start(): void {
    this.emit("state", "live");
    this.timer = setInterval(() => {
      const coin = this.coins[Math.floor(Math.random() * this.coins.length)] ?? "ETH";
      const base = PRICES[coin] ?? 100;
      PRICES[coin] = base * (1 + (Math.random() - 0.5) * 0.0004);
      const count = 1 + Math.floor(Math.random() * 3);
      const trades: HlWsTrade[] = Array.from({ length: count }, () => {
        // Heavy-tailed sizes so the min-size slider has something to do.
        const usd = Math.exp(Math.log(200) + Math.random() * Math.log(5_000));
        const buyer = POOL[Math.floor(Math.random() * POOL.length)] as string;
        let seller = POOL[Math.floor(Math.random() * POOL.length)] as string;
        if (seller === buyer) seller = POOL[(POOL.indexOf(buyer) + 1) % POOL.length] as string;
        return {
          coin,
          side: Math.random() < 0.5 ? "B" : "A",
          px: (PRICES[coin] ?? base).toFixed(2),
          sz: (usd / (PRICES[coin] ?? base)).toFixed(4),
          hash: `0x${hex(64)}`,
          time: Date.now(),
          tid: this.tid++,
          users: [buyer, seller],
        };
      });
      this.emit("trades", trades);
    }, 250);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
