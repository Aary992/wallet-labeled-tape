// Fake trade feed for offline UI work (`npm run dev:fake`). Same events as TradeStream, plus
// random tags so every chip, filter and state in the UI can be built before the scorer exists.

import { EventEmitter } from "node:events";
import type { AccountTags } from "../../shared/protocol.ts";
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
