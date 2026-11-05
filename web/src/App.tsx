import { useMemo, useState } from "react";
import type { AccountTags, Coin, PositionAction, TapeRow, TradeSide } from "../../shared/protocol.ts";
import { useTape } from "./useTape.ts";

type CoinFilter = Coin | "ALL";

const EXPLORER = "https://app.hyperliquid.xyz/explorer/address/";
// Slider stop 0 = any size, then log scale from $1k to $1M (PRD F3).
const SIZE_STOPS = [0, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k` : `$${n.toFixed(0)}`;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour12: false });
const price = (p: number) => (p >= 1_000 ? p.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.toFixed(p >= 10 ? 2 : 4));

export function App() {
  const { rows, status, relayUp } = useTape();
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
        <h2>Profitable Account Flow</h2>
        <p className="muted">Last 15 minutes, accounts not dollars.</p>
        {coins.map((c) => (
          <div key={c} className="flow-card">
            <div className="flow-coin">{c}</div>
            <div className="flow-empty">Waiting for scored accounts</div>
          </div>
        ))}
        <h2 className="spaced">Forward test</h2>
        <div className="flow-card">
          <div className="flow-empty">Cohort not frozen yet</div>
        </div>
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

function Tags({ tags }: { tags: AccountTags }) {
  if (tags.history === "pending") return <span className="tag pending"><span className="spinner" />Pending</span>;
  return (
    <>
      {tags.history === "insufficient" && <span className="tag dim">Insufficient history</span>}
      {tags.perf === "profitable" && <span className="tag good">Profitable (30d)</span>}
      {tags.perf === "unprofitable" && <span className="tag bad">Unprofitable (30d)</span>}
      {tags.perf === "mixed" && <span className="tag dim">Mixed</span>}
      {tags.history === "partial" && tags.coverageDays !== null && (
        <span className="tag dim">covers {tags.coverageDays}d</span>
      )}
      {tags.size === "large" && <span className="tag size">Large</span>}
      {tags.activity === "automated" && <span className="tag act">Likely automated</span>}
      {tags.activity === "market_maker" && <span className="tag act">Likely market maker</span>}
    </>
  );
}

function Action({ action }: { action: PositionAction }) {
  if (action === "unknown") return <span className="action unknown">action unknown</span>;
  return <span className={`action ${action}`}>{action}</span>;
}

function Drawer({ address, rows, onClose }: { address: string; rows: TapeRow[]; onClose: () => void }) {
  const mine = rows.filter((r) => r.buyer.address === address || r.seller.address === address).slice(0, 20);
  const latest = mine[0];
  const tags = latest ? (latest.buyer.address === address ? latest.buyer.tags : latest.seller.tags) : null;
  return (
    <aside className="drawer">
      <div className="drawer-head">
        <span className="mono">{short(address)}</span>
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="drawer-tags">{tags && <Tags tags={tags} />}</div>
      <dl className="metrics">
        <Metric label="Net PnL after fees" />
        <Metric label="Return on volume" />
        <Metric label="Profit factor" />
        <Metric label="Max drawdown" />
        <Metric label="Weeks positive" />
        <Metric label="Closed positions" value={tags?.closedPositions ?? undefined} />
        <Metric label="History covered" value={tags?.coverageDays ? `last ${tags.coverageDays} days` : undefined} />
      </dl>
      <h3>Last {mine.length} trades on this tape</h3>
      <div className="mini">
        {mine.map((r) => {
          const bought = r.buyer.address === address;
          return (
            <div key={`${r.coin}-${r.id}`} className="mini-row">
              <span className="mono muted">{clock(r.time)}</span>
              <span>{r.coin}</span>
              <span className={bought ? "side buy" : "side sell"}>{bought ? "Bought" : "Sold"}</span>
              <span className="num mono">{usd(r.sizeUsd)}</span>
            </div>
          );
        })}
      </div>
      <a className="explorer" href={`${EXPLORER}${address}`} target="_blank" rel="noreferrer">
        Open in Hyperliquid explorer
      </a>
      <p className="scope">
        Based on {tags?.closedPositions ?? "N"} closed positions over the last {tags?.coverageDays ?? "D"} days on
        Hyperliquid. Hedges on other venues and other wallets of the same owner are not visible.
      </p>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value?: string | number }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className="mono">{value ?? <span className="muted">not scored</span>}</dd>
    </>
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
