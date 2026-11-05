// Market-wide trade stream. Uses the public `trades` channel per coin, which is not limited by
// the 10-users-per-IP cap on user subscriptions (PRD: Architecture).

import { EventEmitter } from "node:events";
import WebSocket from "ws";
import { config } from "../config.ts";
import type { HlWsMessage, HlWsTrade } from "./types.ts";

export interface TradeStreamEvents {
  trades: [HlWsTrade[]];
  state: ["live" | "reconnecting"];
  /** Fired after a reconnect: the gap between `since` and now needs a backfill. */
  gap: [{ since: number }];
}

export class TradeStream extends EventEmitter<TradeStreamEvents> {
  private ws: WebSocket | null = null;
  private attempt = 0;
  private pingTimer: NodeJS.Timeout | null = null;
  private lastTradeTime = 0;
  private stopped = false;

  constructor(private readonly coins: readonly string[]) {
    super();
  }

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearPing();
    this.ws?.close();
  }

  private connect(): void {
    const ws = new WebSocket(config.hyperliquid.wsUrl);
    this.ws = ws;

    ws.on("open", () => {
      const wasReconnect = this.attempt > 0;
      this.attempt = 0;
      for (const coin of this.coins) {
        ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin } }));
      }
      this.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ method: "ping" }));
      }, config.hyperliquid.pingIntervalMs);
      this.emit("state", "live");
      if (wasReconnect && this.lastTradeTime > 0) this.emit("gap", { since: this.lastTradeTime });
    });

    ws.on("message", (raw) => {
      let msg: HlWsMessage;
      try {
        msg = JSON.parse(raw.toString()) as HlWsMessage;
      } catch {
        return;
      }
      if (msg.channel === "trades" && Array.isArray(msg.data)) {
        const trades = msg.data as HlWsTrade[];
        for (const t of trades) if (t.time > this.lastTradeTime) this.lastTradeTime = t.time;
        this.emit("trades", trades);
      } else if (msg.channel === "error") {
        console.warn("[stream] server error:", msg.data);
      }
    });

    ws.on("close", () => this.scheduleReconnect());
    ws.on("error", (err) => {
      console.warn("[stream] socket error:", err.message);
      ws.close();
    });
  }

  private scheduleReconnect(): void {
    this.clearPing();
    if (this.stopped) return;
    const steps = config.hyperliquid.reconnectBackoffMs;
    const delay = steps[Math.min(this.attempt, steps.length - 1)] ?? 10_000;
    this.attempt += 1;
    this.emit("state", "reconnecting");
    setTimeout(() => this.connect(), delay);
  }

  private clearPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }
}
