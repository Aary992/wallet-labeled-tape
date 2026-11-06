// HTTP side of the relay: account detail for the drawer. A 404 (address never seen) shows as
// "not scored yet", never as an error.

import { useEffect, useState } from "react";
import type { AccountDetail } from "../../shared/protocol.ts";

import { RELAY_URL as RELAY_WS } from "./relayUrl.ts";
export const RELAY_HTTP = RELAY_WS.replace(/^ws/, "http").replace(/\/ws$/, "");

type Remote<T> =
  | { state: "loading" }
  | { state: "ready"; data: T }
  | { state: "missing" }
  | { state: "offline" };

async function getJson<T>(path: string, signal: AbortSignal): Promise<Remote<T>> {
  try {
    const res = await fetch(`${RELAY_HTTP}${path}`, { signal });
    if (res.status === 404) return { state: "missing" };
    if (!res.ok) return { state: "offline" };
    return { state: "ready", data: (await res.json()) as T };
  } catch {
    return signal.aborted ? { state: "loading" } : { state: "offline" };
  }
}

/** Polls while mounted, keeping the last good value while a refresh is in flight. */
function usePolled<T>(path: string | null, everyMs: number): Remote<T> {
  const [value, setValue] = useState<Remote<T>>({ state: "loading" });

  useEffect(() => {
    if (!path) return;
    setValue({ state: "loading" });
    const ctrl = new AbortController();
    let timer: number | undefined;
    const tick = async () => {
      const next = await getJson<T>(path, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setValue((prev) => (next.state === "loading" ? prev : next));
      timer = window.setTimeout(tick, everyMs);
    };
    void tick();
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [path, everyMs]);

  return value;
}

/** Account detail, refreshed every 15 s so a Pending account turns into tags while open. */
export const useAccount = (address: string | null) =>
  usePolled<AccountDetail>(address ? `/api/account/${address}` : null, 15_000);
