// Account drawer (PRD F5): tags, metrics, coverage, positions, last 20 trades, honest-scope note.
// Reads GET /api/account/:address; until the account is scored it falls back to what the tape saw.

import type { AccountDetail, AccountMetrics, AccountTags, TapeRow } from "../../shared/protocol.ts";
import { useAccount } from "./api.ts";
import { Action, Tags } from "./Tags.tsx";
import { clock, dayClock, duration, pct, pctOfOne, short, signedUsd, usd } from "./format.ts";

const EXPLORER = "https://app.hyperliquid.xyz/explorer/address/";

export function Drawer({ address, rows, onClose }: { address: string; rows: TapeRow[]; onClose: () => void }) {
  const remote = useAccount(address);
  const detail: AccountDetail | null = remote.state === "ready" ? remote.data : null;

  const seen = rows.filter((r) => r.buyer.address === address || r.seller.address === address);
  const latest = seen[0];
  const tapeTags = latest ? (latest.buyer.address === address ? latest.buyer.tags : latest.seller.tags) : null;
  const tags: AccountTags | null = detail?.tags ?? tapeTags;
  const m = detail?.metrics ?? null;
  const trades = (detail?.recentTrades.length ? detail.recentTrades : seen).slice(0, 20);

  return (
    <aside className="drawer" aria-label={`Account ${address}`}>
      <div className="drawer-head">
        <span className="mono" title={address}>
          {short(address)}
        </span>
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="drawer-tags">{tags && <Tags tags={tags} />}</div>

      {m ? <MetricsList m={m} /> : <NotScored loading={remote.state === "loading"} />}

      {detail && detail.positions.length > 0 && (
        <>
          <h3>Current position</h3>
          <div className="positions">
            {detail.positions.map((p) => (
              <div key={p.coin} className="mini-row pos">
                <span>{p.coin}</span>
                <span className={p.size > 0 ? "side buy" : p.size < 0 ? "side sell" : "muted"}>
                  {p.size > 0 ? "Long" : p.size < 0 ? "Short" : "Flat"}
                </span>
                <span className="num mono">{Math.abs(p.size).toPrecision(4)}</span>
                <span className="muted">{p.needsReconcile ? "checking" : ""}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3>Last {trades.length} trades on this tape</h3>
      <div className="mini">
        {trades.length === 0 && <div className="muted">None since the backend started.</div>}
        {trades.map((r) => {
          const bought = r.buyer.address === address;
          const side = bought ? r.buyer : r.seller;
          return (
            <div key={`${r.coin}-${r.id}`} className="mini-row">
              <span className="mono muted">{clock(r.time)}</span>
              <span>{r.coin}</span>
              <span className={bought ? "side buy" : "side sell"}>{bought ? "Bought" : "Sold"}</span>
              <span className="num mono">{usd(r.sizeUsd)}</span>
              {side.action === "unknown" ? <span /> : <Action action={side.action} />}
            </div>
          );
        })}
      </div>

      <a className="explorer" href={`${EXPLORER}${address}`} target="_blank" rel="noreferrer">
        Open in Hyperliquid explorer
      </a>

      <p className="scope">
        {m
          ? `Based on ${m.closedPositions} closed positions over the last ${Math.floor(m.coverageDays)} days on Hyperliquid. `
          : "Tags appear once this account's history is fetched. "}
        Hedges on other venues and other wallets of the same owner are not visible.
      </p>
      {(detail?.firstObservedAt || detail?.scoredAt) && (
        <p className="scope">
          {detail.firstObservedAt ? `First observed by this app ${dayClock(detail.firstObservedAt)}. ` : ""}
          {detail.scoredAt ? `Scored ${dayClock(detail.scoredAt)}.` : ""}
        </p>
      )}
    </aside>
  );
}

function MetricsList({ m }: { m: AccountMetrics }) {
  const coverage =
    `last ${Math.floor(m.coverageDays)} days` + (m.hitFillCap ? " (10,000 fill limit reached)" : "");
  return (
    <dl className="metrics">
      <Metric label="Net PnL after fees" value={signedUsd(m.netPnlUsd)} tone={m.netPnlUsd > 0 ? "good" : m.netPnlUsd < 0 ? "bad" : undefined} />
      <Metric label="Return on volume" value={pctOfOne(m.returnOnVolume, 2)} />
      <Metric
        label="Profit factor"
        value={m.profitFactor === null ? "no closed trips" : m.profitFactor >= 999 ? "no losing trips" : m.profitFactor.toFixed(2)}
      />
      <Metric label="Max drawdown" value={pct(m.maxDrawdownPct)} />
      <Metric label="Weeks positive" value={pct(m.weeksPositivePct)} />
      <Metric label="Closed positions" value={m.closedPositions.toLocaleString()} />
      <Metric label="History covered" value={coverage} />
      <Metric label="Traded volume" value={usd(m.tradedNotionalUsd)} />
      <Metric label="Typical position" value={m.medianPositionNotionalUsd === null ? "n/a" : usd(m.medianPositionNotionalUsd)} />
      <Metric label="Typical hold" value={m.medianHoldSeconds === null ? "n/a" : duration(m.medianHoldSeconds)} />
      <Metric label="Fills per day" value={Math.round(m.fillsPerDay).toLocaleString()} />
      <Metric label="Resting orders" value={pctOfOne(m.makerShare, 0)} />
    </dl>
  );
}

function NotScored({ loading }: { loading: boolean }) {
  return (
    <div className="not-scored">
      {loading ? "Loading account" : "Not scored yet. Accounts are scored largest trades first, so small ones may wait or be skipped."}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={`mono ${tone ?? ""}`}>{value}</dd>
    </>
  );
}
