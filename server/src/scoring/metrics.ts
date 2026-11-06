import type { AccountMetrics } from "../../../shared/protocol.ts";
import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";
import type { RoundTrip } from "./roundtrips.ts";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MONDAY_EPOCH = 4 * DAY_MS;

function median(values: number[]): number | null {
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid]! : (values[mid - 1]! + values[mid]!) / 2;
}

/**
 * Time-weighted account exposure, using each coin's last observed fill price.
 * Sum absolute notionals: opposite positions in different coins do not cancel.
 * Seed truncated positions from their first startPosition and include the tail
 * through now. No market prices or positions outside the supplied fills are used.
 */
function flatShare(fills: HlFill[], start: number, now: number): number {
  if (now <= start) return 0;
  const states = new Map<string, { size: number; px: number }>();
  const normalize = (size: number) => Math.abs(size) < config.positions.zeroEpsilon ? 0 : size;
  let notional = 0;
  for (const fill of fills) {
    if (!states.has(fill.coin)) {
      const state = { size: normalize(Number(fill.startPosition)), px: Number(fill.px) };
      states.set(fill.coin, state);
      notional += Math.abs(state.size) * state.px;
    }
  }
  let previous = start;
  let flatMs = 0;
  for (const fill of fills) {
    if (fill.time > now) break;
    const at = Math.max(start, fill.time);
    if (notional < config.scoring.marketMaker.flatNotionalUsd) flatMs += at - previous;
    const state = states.get(fill.coin)!;
    notional -= Math.abs(state.size) * state.px;
    state.size = normalize(state.size + (fill.side === "B" ? 1 : -1) * Number(fill.sz));
    state.px = Number(fill.px);
    notional += Math.abs(state.size) * state.px;
    previous = at;
  }
  if (notional < config.scoring.marketMaker.flatNotionalUsd) flatMs += now - previous;
  return flatMs / (now - start);
}

export function computeMetrics(fills: HlFill[], trips: RoundTrip[], now: number): AccountMetrics {
  const coverageStart = fills[0]?.time ?? now;
  const coverageDays = Math.min(config.scoring.windowDays, Math.max(0, (now - coverageStart) / DAY_MS));
  const closed = trips.filter((trip) => trip.closeTime !== null)
    .sort((a, b) => a.closeTime! - b.closeTime!);
  let netPnlUsd = 0;
  let wins = 0;
  let losses = 0;
  let peak = 0;
  let drawdown = 0;
  const weeks = new Map<number, number>();
  for (const trip of closed) {
    netPnlUsd += trip.pnlUsd;
    wins += Math.max(0, trip.pnlUsd);
    losses += Math.max(0, -trip.pnlUsd);
    peak = Math.max(peak, netPnlUsd);
    if (peak > 0) drawdown = Math.max(drawdown, (peak - netPnlUsd) / peak * 100);
    // Active weeks are UTC calendar weeks (Monday start) containing a closed trip.
    const week = Math.floor((trip.closeTime! - MONDAY_EPOCH) / WEEK_MS);
    weeks.set(week, (weeks.get(week) ?? 0) + trip.pnlUsd);
  }
  const tradedNotionalUsd = fills.reduce((sum, fill) => sum + Number(fill.sz) * Number(fill.px), 0);
  return {
    netPnlUsd,
    tradedNotionalUsd,
    returnOnVolume: tradedNotionalUsd > 0 ? netPnlUsd / tradedNotionalUsd : 0,
    profitFactor: !closed.length ? null : losses > 0 ? wins / losses : wins > 0 ? 999 : 0,
    maxDrawdownPct: peak > 0 ? drawdown : 100,
    weeksPositivePct: weeks.size ? [...weeks.values()].filter((pnl) => pnl > 0).length / weeks.size * 100 : 0,
    closedPositions: closed.length,
    makerShare: fills.length ? fills.filter((fill) => fill.crossed === false).length / fills.length : 0,
    fillsPerDay: coverageDays > 0 ? fills.length / coverageDays : 0,
    medianHoldSeconds: median(closed.map((trip) => (trip.closeTime! - trip.openTime) / 1000)),
    medianPositionNotionalUsd: median(trips.map((trip) => trip.maxNotionalUsd)),
    flatShare: fills.length ? flatShare(fills, Math.max(coverageStart, now - config.scoring.windowDays * DAY_MS), now) : 0,
    fillCount: fills.length,
    hitFillCap: fills.length >= config.fills.maxReachable,
    coverageStart,
    coverageDays,
  };
}
