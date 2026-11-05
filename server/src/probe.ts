// Hour-0 API check (PRD: "confirm field names and current rate limits in the first hour").
// `npm run probe` prints one live trades message and one page of fills for an address seen in it,
// so the field names in hl/types.ts can be confirmed against reality.

import WebSocket from "ws";
import { config } from "./config.ts";
import type { HlFill, HlWsTrade } from "./hl/types.ts";

const ws = new WebSocket(config.hyperliquid.wsUrl);
const timeout = setTimeout(() => {
  console.error("No trades within 20 s. Check your connection.");
  process.exit(1);
}, 20_000);

ws.on("open", () => {
  ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin: "ETH" } }));
});

ws.on("message", async (raw) => {
  const msg = JSON.parse(raw.toString()) as { channel: string; data: unknown };
  if (msg.channel !== "trades") return;
  clearTimeout(timeout);
  const trades = msg.data as HlWsTrade[];
  console.log("== trades message (first element) ==");
  console.log(JSON.stringify(trades[0], null, 2));
  ws.close();

  const user = trades[0]?.users[0];
  if (!user) return;
  const startTime = Date.now() - config.scoring.windowDays * 86_400_000;
  const res = await fetch(config.hyperliquid.infoUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "userFillsByTime", user, startTime }),
  });
  const fills = (await res.json()) as HlFill[];
  console.log(`\n== userFillsByTime for ${user}: ${fills.length} fills in one page ==`);
  console.log(JSON.stringify(fills[0], null, 2));
  if (fills.length > 0) {
    const oldest = Math.min(...fills.map((f) => f.time));
    console.log(`oldest fill in page: ${new Date(oldest).toISOString()}`);
  }
});
