// Connects to the local relay and keeps the newest MAX_ROWS trades plus the latest status.
// Rows arrive in bursts, so state updates are batched to one per animation frame.

import { useEffect, useRef, useState } from "react";
import type { FlowSnapshot, ServerMessage, StatusSnapshot, TapeRow } from "../../shared/protocol.ts";

const RELAY_URL = import.meta.env.VITE_RELAY_URL ?? "ws://localhost:8787/ws";
const MAX_ROWS = 400;

export interface TapeState {
  rows: TapeRow[];
  status: StatusSnapshot | null;
  flow: FlowSnapshot[];
  relayUp: boolean;
}

export function useTape(): TapeState {
  const [state, setState] = useState<TapeState>({ rows: [], status: null, flow: [], relayUp: false });
  const pending = useRef<TapeRow[]>([]);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: number | undefined;
    let closed = false;

    const flush = () => {
      frame.current = null;
      const incoming = pending.current;
      pending.current = [];
      if (incoming.length === 0) return;
      setState((s) => ({ ...s, rows: [...incoming.reverse(), ...s.rows].slice(0, MAX_ROWS) }));
    };

    const connect = () => {
      socket = new WebSocket(RELAY_URL);
      socket.onopen = () => setState((s) => ({ ...s, relayUp: true }));
      socket.onclose = () => {
        setState((s) => ({ ...s, relayUp: false }));
        if (!closed) retry = window.setTimeout(connect, 1_000);
      };
      socket.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string) as ServerMessage;
        switch (msg.type) {
          case "hello":
            setState((s) => ({ ...s, status: msg.status, rows: msg.backlog.slice(0, MAX_ROWS) }));
            break;
          case "trades":
            // Rows inside one message are oldest first; the tape shows newest on top.
            pending.current.push(...msg.rows);
            if (frame.current === null) frame.current = requestAnimationFrame(flush);
            break;
          case "status":
            setState((s) => ({ ...s, status: msg.status }));
            break;
          case "flow":
            setState((s) => ({ ...s, flow: msg.flow }));
            break;
        }
      };
    };

    connect();
    return () => {
      closed = true;
      window.clearTimeout(retry);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      socket?.close();
    };
  }, []);

  return state;
}
