// Left panel: Profitable Account Flow per coin (PRD F4).

import type { Coin, FlowSnapshot } from "../../shared/protocol.ts";
import { pct } from "./format.ts";

export function FlowPanel({ coins, flow, focus }: { coins: Coin[]; flow: FlowSnapshot[]; focus: Coin | "ALL" }) {
  const windowMinutes = flow[0]?.windowMinutes ?? 15;
  const shown = focus === "ALL" ? coins : coins.filter((c) => c === focus);
  return (
    <>
      <h2>Profitable Account Flow</h2>
      <p className="muted">Last {windowMinutes} minutes. Counts accounts, not dollars.</p>
      {shown.map((c) => (
        <FlowCard key={c} coin={c} snap={flow.find((f) => f.coin === c)} />
      ))}
    </>
  );
}

function FlowCard({ coin, snap }: { coin: Coin; snap: FlowSnapshot | undefined }) {
  if (!snap) {
    return (
      <div className="flow-card">
        <div className="flow-coin">{coin}</div>
        <div className="flow-empty">Waiting for scored accounts</div>
      </div>
    );
  }
  const total = snap.raised + snap.cut;
  const raisedShare = total === 0 ? 50 : (snap.raised / total) * 100;
  return (
    <div className="flow-card">
      <div className="flow-top">
        <span className="flow-coin">{coin}</span>
        <span className={`coverage ${snap.coveragePct < 30 ? "low" : ""}`} title="Share of traded notional from scored accounts">
          Coverage {pct(snap.coveragePct)}
        </span>
      </div>
      {total === 0 ? (
        <div className="flow-empty">No profitable accounts changed {coin} exposure</div>
      ) : (
        <>
          <div className="flow-counts">
            <span className="raised">
              <strong className="mono">{snap.raised}</strong> raised
            </span>
            <span className="cut">
              <strong className="mono">{snap.cut}</strong> cut
            </span>
          </div>
          <div className="flow-bar" aria-hidden="true">
            <span style={{ width: `${raisedShare}%` }} />
          </div>
          <div className="flow-line">
            {snap.raised} profitable {snap.raised === 1 ? "account" : "accounts"} raised {coin} long exposure,{" "}
            {snap.cut} cut it.
          </div>
        </>
      )}
    </div>
  );
}
