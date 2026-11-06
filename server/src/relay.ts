// Local HTTP + WebSocket server the browser connects to. ws://localhost:8787/ws streams tape rows,
// GET /api/health returns status JSON, GET /api/account/:address returns one account's detail.

import { createServer, type ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config.ts";
import type { AccountDetail, ServerMessage, StatusSnapshot, TapeRow } from "../../shared/protocol.ts";

// Hosted mode: when `npm run build` has produced web/dist, the relay also serves the web app, so one
// process on one port is the whole product (one URL for the ETHGlobal demo link).
const WEB_DIST = fileURLToPath(new URL("../../web/dist/", import.meta.url));
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

function serveWeb(url: string, res: ServerResponse): boolean {
  if (!existsSync(WEB_DIST)) return false;
  const path = decodeURIComponent(url.split("?")[0]!);
  let file = normalize(join(WEB_DIST, path));
  if (!file.startsWith(normalize(WEB_DIST))) return false;
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(WEB_DIST, "index.html");
  res.setHeader("content-type", MIME[extname(file)] ?? "application/octet-stream");
  res.end(readFileSync(file));
  return true;
}

/** Returns null for an address the app has never seen (404). */
export type AccountLookup = (address: string) => AccountDetail | null;

export class Relay {
  private wss: WebSocketServer;
  private backlog: TapeRow[] = [];

  constructor(
    private readonly getStatus: () => StatusSnapshot,
    private readonly lookupAccount: AccountLookup = () => null,
  ) {
    const http = createServer((req, res) => {
      res.setHeader("access-control-allow-origin", "*");
      if (req.url === "/api/health") {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: true, status: this.getStatus() }));
        return;
      }
      const match = req.url?.match(/^\/api\/account\/(0x[0-9a-fA-F]{40})$/);
      if (match) {
        const detail = this.lookupAccount(match[1]!.toLowerCase());
        res.setHeader("content-type", "application/json");
        if (!detail) res.statusCode = 404;
        res.end(JSON.stringify(detail ?? { error: "not seen" }));
        return;
      }
      if (serveWeb(req.url ?? "/", res)) return;
      res.statusCode = 404;
      res.end("not found");
    });

    this.wss = new WebSocketServer({ server: http, path: "/ws" });
    // ws re-emits the http server's errors on the WebSocketServer, so both need a handler.
    const onError = (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[relay] Port ${config.port} is already taken. Another copy of the backend is probably ` +
            `running (close that terminal or preview), or set RELAY_PORT to a free port.`,
        );
        process.exit(1);
      }
      throw err;
    };
    http.on("error", onError);
    this.wss.on("error", onError);
    this.wss.on("connection", (socket) => {
      this.send(socket, { type: "hello", status: this.getStatus(), backlog: this.backlog });
    });

    http.listen(config.port, () => {
      console.log(`[relay] ws://localhost:${config.port}/ws  health: http://localhost:${config.port}/api/health`);
    });
  }

  pushTrades(rows: TapeRow[]): void {
    if (rows.length === 0) return;
    // Newest first by exchange time: coins arrive on separate streams, so arrival order is not time order.
    this.backlog = [...rows, ...this.backlog]
      .sort((a, b) => b.time - a.time)
      .slice(0, config.storage.tapeBacklogRows);
    this.broadcast({ type: "trades", rows });
  }

  broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    }
  }

  private send(socket: WebSocket, msg: ServerMessage): void {
    socket.send(JSON.stringify(msg));
  }
}
