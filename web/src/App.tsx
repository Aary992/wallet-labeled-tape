import { useMemo, useState } from "react";
import type { Coin, TapeRow, TradeSide } from "../../shared/protocol.ts";
import { useTape } from "./useTape.ts";
import { Action, Tags } from "./Tags.tsx";
import { Drawer } from "./Drawer.tsx";
import { FlowPanel, ForwardTestCard } from "./Panels.tsx";
import { clock, price, short, usd } from "./format.ts";

type CoinFilter = Coin | "ALL";

// Slider stop 0 = any size, then log scale from $1k to $1M (PRD F3).
const SIZE_STOPS = [0, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];


export function App() {
  const { rows, status, flow, relayUp } = useTape();
  const [coin, setCoin] = useState<CoinFilter>("ALL");
  const [profitableOnly, setProfitableOnly] = useState(false);
  const [hideCloses, setHideCloses] = useState(false);
  const [sizeStop, setSizeStop] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const minSize = SIZE_STOPS[sizeStop] ?? 0;
  const coins = status?.coins ?? ["BTC", "ETH", "SOL"];

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (coin !== "ALL" && r.coin !== coin) return false;
        if (r.sizeUsd < minSize) return false;
        if (profitableOnly && r.buyer.tags.perf !== "profitable" && r.seller.tags.perf !== "profitable") return false;
        if (hideCloses && r.buyer.action === "close" && r.seller.action === "close") return false;
        return true;
      }),
    [rows, coin, minSize, profitableOnly, hideCloses],
  );

  const connection = !relayUp ? "down" : (status?.connection ?? "reconnecting");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Wallet-Labeled Tape
          {status?.mode === "fake" && <span className="fake-badge">FAKE FEED</span>}
        </div>
        <nav className="coins">
          {(["ALL", ...coins] as CoinFilter[]).map((c) => (
            <button key={c} className={c === coin ? "tab active" : "tab"} onClick={() => setCoin(c)}>
              {c === "ALL" ? "All" : c}
            </button>
          ))}
        </nav>
        <div className="stats">
          <span className={`dot ${connection}`} title={connection} />
          <span>{connectionLabel(connection)}</span>
          <Stat label="Accounts scored" value={status ? `${status.accountsScored} / ${status.accountsSeen}` : "0"} />
          <Stat label="Queue" value={String(status?.queueLength ?? 0)} />
          <Stat label="REST budget" value={`${status?.restWeightUsedPct ?? 0}%`} />
        </div>
      </header>

      <aside className="left">
        <FlowPanel coins={coins} flow={flow} focus={coin} />
        <ForwardTestCard />
      </aside>

      <main className="center">
        <div className="filters">
          <button className={profitableOnly ? "chip on" : "chip"} onClick={() => setProfitableOnly((v) => !v)}>
            Profitable only
          </button>
          <button className={hideCloses ? "chip on" : "chip"} onClick={() => setHideCloses((v) => !v)}>
            Hide closes
          </button>
          <label className="slider">
            Min size <strong>{minSize === 0 ? "Any" : usd(minSize)}</strong>
            <input
              type="range"
              min={0}
              max={SIZE_STOPS.length - 1}
              value={sizeStop}
              onChange={(e) => setSizeStop(Number(e.target.value))}
            />
          </label>
          <span className="muted count">
            {visible.length} of {rows.length} trades
          </span>
        </div>

        <div className="tape">
          <div className="row head">
            <span>Time</span>
            <span>Coin</span>
            <span>Side</span>
            <span className="num">Price</span>
            <span className="num">Size</span>
            <span>Buyer</span>
            <span>Seller</span>
          </div>
          {visible.length === 0 && (
            <div className="empty">{relayUp ? "Waiting for trades that match your filters" : "Backend not running. Start it with npm run dev"}</div>
          )}
          {visible.map((r) => (
            <TradeRow key={`${r.coin}-${r.id}`} row={r} onPick={setSelected} />
          ))}
        </div>
      </main>

      {selected && <Drawer address={selected} rows={rows} onClose={() => setSelected(null)} />}

      <footer className="footer">
        Tags describe Hyperliquid accounts over a stated window. Not a full picture of any trader. Not advice.
      </footer>
    </div>
  );
}

function TradeRow({ row, onPick }: { row: TapeRow; onPick: (a: string) => void }) {
  return (
    <div className={`row ${row.side}`}>
      <span className="mono muted">{clock(row.time)}</span>
      <span>{row.coin}</span>
      <span className={`side ${row.side}`}>{row.side === "buy" ? "Buy" : "Sell"}</span>
      <span className="num mono">{price(row.price)}</span>
      <span className={`num mono ${row.sizeUsd >= 100_000 ? "big" : ""}`}>{usd(row.sizeUsd)}</span>
      <Account side={row.buyer} onPick={onPick} />
      <Account side={row.seller} onPick={onPick} />
    </div>
  );
}

function Account({ side, onPick }: { side: TradeSide; onPick: (a: string) => void }) {
  return (
    <span className="account">
      <button className="addr mono" onClick={() => onPick(side.address)}>
        {short(side.address)}
      </button>
      <Tags tags={side.tags} />
      <Action action={side.action} />
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="stat">
      <span className="muted">{label}</span> <span className="mono">{value}</span>
    </span>
  );
}

function connectionLabel(c: string) {
  if (c === "live") return "Live";
  if (c === "reconciling") return "Reconciling";
  if (c === "down") return "Backend offline";
  return "Reconnecting";
}
