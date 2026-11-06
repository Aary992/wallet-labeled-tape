// Left panel: Profitable Account Flow per coin (PRD F4) and the forward-test card (Validation).

import { useState } from "react";
import type { Coin, FlowSnapshot, ForwardTestGroup, ForwardTestReport } from "../../shared/protocol.ts";
import { useForwardTest } from "./api.ts";
import { bps, dayClock, hours, pct } from "./format.ts";

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

const GROUP_LABEL: Record<ForwardTestGroup, string> = {
  profitable: "Profitable (30d)",
  unprofitable: "Unprofitable (30d)",
  random: "Random match",
  all: "All scored",
};
const GROUP_ORDER: ForwardTestGroup[] = ["profitable", "random", "unprofitable", "all"];

export function ForwardTestCard() {
  const remote = useForwardTest();
  return (
    <>
      <h2 className="spaced">Forward test</h2>
      {remote.state === "ready" ? (
        <Report report={remote.data} />
      ) : (
        <div className="flow-card">
          <div className="flow-empty">
            {remote.state === "loading" ? "Loading" : "Cohort not frozen yet. Results appear here once it is measured."}
          </div>
        </div>
      )}
    </>
  );
}

function Report({ report }: { report: ForwardTestReport }) {
  const horizons = [...new Set(report.results.map((r) => r.horizonMinutes))].sort((a, b) => a - b);
  const [horizon, setHorizon] = useState<number | null>(null);
  const h = horizon ?? (horizons.includes(60) ? 60 : (horizons[0] ?? 0));
  const rows = GROUP_ORDER.map((g) => report.results.find((r) => r.group === g && r.horizonMinutes === h)).filter(
    (r): r is NonNullable<typeof r> => r !== undefined,
  );

  return (
    <div className="flow-card ft">
      <div className="ft-meta">
        Cohort frozen {dayClock(report.frozenAt)}, measured for {hours(report.measuredUntil - report.frozenAt)}
      </div>
      <div className="ft-tabs" role="tablist">
        {horizons.map((x) => (
          <button key={x} role="tab" aria-selected={x === h} className={x === h ? "tab active" : "tab"} onClick={() => setHorizon(x)}>
            {x >= 60 ? `${x / 60}h` : `${x}m`}
          </button>
        ))}
      </div>
      <table className="ft-table">
        <thead>
          <tr>
            <th>Group</th>
            <th className="num">Signals</th>
            <th className="num" title="Share of signals that made money after delay and fees">Hit</th>
            <th className="num" title="Average return after delay and fees, basis points">Avg bps</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.group} className={r.group === "profitable" ? "lead" : ""}>
              <td>{GROUP_LABEL[r.group]}</td>
              <td className="num mono">{r.signals}</td>
              <td className="num mono">{r.hitRatePct === null ? "n/a" : pct(r.hitRatePct)}</td>
              <td className={`num mono ${r.avgReturnBps === null ? "" : r.avgReturnBps > 0 ? "good" : "bad"}`}>
                {r.avgReturnBps === null ? "n/a" : bps(r.avgReturnBps).replace(" bps", "")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ft-note">
        Random match = accounts of similar size and activity, picked at random. After a{" "}
        {report.copyDelaySeconds} s copy delay and {report.roundTripFeeBps} bps round-trip fees. A few hours
        cannot prove an edge.
      </p>
      <p className="ft-note mono" title={report.cohortSha256}>
        Cohort sha256 {report.cohortSha256.slice(0, 12)}
      </p>
    </div>
  );
}
