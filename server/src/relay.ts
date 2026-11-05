// Local HTTP + WebSocket server the browser connects to. ws://localhost:8787/ws streams tape rows,
// GET /api/health returns status JSON.

import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config.ts";
import type { ServerMessage, StatusSnapshot, TapeRow } from "../../shared/protocol.ts";

export class Relay {
  private wss: WebSocketServer;
  private backlog: TapeRow[] = [];

  constructor(private readonly getStatus: () => StatusSnapshot) {
    const http = createServer((req, res) => {
      res.setHeader("access-control-allow-origin", "*");
      if (req.url === "/api/health") {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: true, status: this.getStatus() }));
        return;
      }
      res.statusCode = 404;
      res.end("not found");
    });

    this.wss = new WebSocketServer({ server: http, path: "/ws" });
    this.wss.on("connection", (socket) => {
      this.send(socket, { type: "hello", status: this.getStatus(), backlog: this.backlog });
    });

    http.listen(config.port, () => {
      console.log(`[relay] ws://localhost:${config.port}/ws  health: http://localhost:${config.port}/api/health`);
    });
  }

  pushTrades(rows: TapeRow[]): void {
    if (rows.length === 0) return;
    this.backlog = [...rows, ...this.backlog].slice(0, config.storage.tapeBacklogRows);
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
