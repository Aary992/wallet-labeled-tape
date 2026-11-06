import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";
import { buildRoundTrips, type RoundTrip } from "./roundtrips.ts";
import { computeMetrics } from "./metrics.ts";

const DAY = 86_400_000;
const MONDAY = Date.UTC(2026, 9, 5);
function fill(overrides: Partial<HlFill> = {}): HlFill {
  return { coin: "BTC", px: "100", sz: "1", side: "B", time: MONDAY,
    startPosition: "0", dir: "", closedPnl: "0", hash: "test", oid: 1,
    crossed: true, fee: "0", tid: 1, ...overrides };
}
function trip(pnlUsd: number, closeTime: number | null, openTime = MONDAY): RoundTrip {
  return { coin: "BTC", openTime, closeTime, pnlUsd, maxNotionalUsd: 100,
    fillCount: 2, truncated: false };
}
function near(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
}

test("all fields from handmade fills; open trip fees do not affect realized performance", () => {
  const fills = [
    fill({ fee: "1", crossed: false }),
    fill({ time: MONDAY + DAY, side: "A", startPosition: "1", px: "110", closedPnl: "10", fee: "1" }),
    fill({ time: MONDAY + 2 * DAY, sz: "2", fee: "50", crossed: false }),
  ];
  const trips = buildRoundTrips(fills);
  assert.deepEqual(computeMetrics(fills, trips, MONDAY + 4 * DAY), {
    netPnlUsd: 8, tradedNotionalUsd: 410, returnOnVolume: 8 / 410,
    profitFactor: 999, maxDrawdownPct: 0, weeksPositivePct: 100, closedPositions: 1,
    makerShare: 2 / 3, fillsPerDay: 0.75, medianHoldSeconds: DAY / 1000,
    medianPositionNotionalUsd: 155, flatShare: 1, fillCount: 3, hitFillCap: false,
    coverageStart: MONDAY, coverageDays: 4,
  });
});

test("empty and zero duration histories have explicit finite defaults", () => {
  assert.deepEqual(computeMetrics([], [], MONDAY), {
    netPnlUsd: 0, tradedNotionalUsd: 0, returnOnVolume: 0, profitFactor: null,
    maxDrawdownPct: 100, weeksPositivePct: 0, closedPositions: 0, makerShare: 0,
    fillsPerDay: 0, medianHoldSeconds: null, medianPositionNotionalUsd: null,
    flatShare: 0, fillCount: 0, hitFillCap: false, coverageStart: MONDAY, coverageDays: 0,
  });
  const fills = [fill()];
  const metrics = computeMetrics(fills, buildRoundTrips(fills), MONDAY);
  assert.equal(metrics.fillsPerDay, 0);
  assert.equal(metrics.flatShare, 0);
  assert.equal(metrics.medianHoldSeconds, null);
});

test("closed trips are ordered by exit for drawdown; active UTC weeks aggregate net PnL", () => {
  const trips = [trip(-40, MONDAY + 8 * DAY), trip(100, MONDAY + DAY),
    trip(-10, MONDAY + 2 * DAY), trip(50, MONDAY + 22 * DAY), trip(10000, null)];
  const copy = structuredClone(trips);
  const metrics = computeMetrics([fill()], trips, MONDAY + 28 * DAY);
  assert.equal(metrics.netPnlUsd, 100);
  assert.equal(metrics.profitFactor, 3);
  assert.equal(metrics.maxDrawdownPct, 50);
  near(metrics.weeksPositivePct, 200 / 3);
  assert.equal(metrics.closedPositions, 4);
  assert.equal(metrics.medianHoldSeconds, 5 * DAY / 1000);
  assert.deepEqual(trips, copy);
});

test("no positive peak means 100% drawdown; losses and breakeven have factor zero", () => {
  for (const pnl of [-5, 0]) {
    const metrics = computeMetrics([fill()], [trip(pnl, MONDAY)], MONDAY + DAY);
    assert.equal(metrics.maxDrawdownPct, 100);
    assert.equal(metrics.profitFactor, 0);
    assert.equal(metrics.weeksPositivePct, 0);
  }
  const metrics = computeMetrics([fill()], [trip(10, MONDAY), trip(-30, MONDAY + DAY)], MONDAY + 2 * DAY);
  assert.equal(metrics.maxDrawdownPct, 300);
});

test("calendar weeks start Monday, inactive weeks are excluded and zero weeks are not wins", () => {
  const trips = [trip(10, MONDAY + 7 * DAY - 1), trip(-10, MONDAY + 7 * DAY),
    trip(10, MONDAY + 8 * DAY), trip(-5, MONDAY + 21 * DAY)];
  const metrics = computeMetrics([fill()], trips, MONDAY + 28 * DAY);
  near(metrics.weeksPositivePct, 100 / 3);
});

test("coverage is capped, fills per day uses covered days and the reachable cap is inclusive", () => {
  for (const count of [config.fills.maxReachable - 1, config.fills.maxReachable, config.fills.maxReachable + 1]) {
    const fills = Array.from({ length: count }, (_, i) => fill({ time: MONDAY + i }));
    const metrics = computeMetrics(fills, [], MONDAY + 40 * DAY);
    assert.equal(metrics.coverageStart, MONDAY);
    assert.equal(metrics.coverageDays, config.scoring.windowDays);
    assert.equal(metrics.fillCount, count);
    assert.equal(metrics.fillsPerDay, count / config.scoring.windowDays);
    assert.equal(metrics.hitFillCap, count >= config.fills.maxReachable);
    const shortCoverage = computeMetrics(fills, [], MONDAY + DAY);
    assert.equal(shortCoverage.coverageDays, 1);
    assert.equal(shortCoverage.hitFillCap, count >= config.fills.maxReachable);
  }
});

test("flatShare weights time, includes final open exposure and uses a strict notional boundary", () => {
  const threshold = config.scoring.marketMaker.flatNotionalUsd;
  for (const px of [threshold - 1, threshold, threshold + 1]) {
    const fills = [fill({ px: String(px) }),
      fill({ time: MONDAY + DAY, px: String(px), side: "A", startPosition: "1" })];
    assert.equal(computeMetrics(fills, [], MONDAY + 4 * DAY).flatShare, px < threshold ? 1 : 0.75);
    assert.equal(computeMetrics(fills.slice(0, 1), [], MONDAY + 4 * DAY).flatShare, px < threshold ? 1 : 0);
  }
});

test("flatShare sums simultaneous coin exposure and updates prices and partial positions", () => {
  const fills = [fill({ px: "6000" }), fill({ coin: "ETH", side: "A", px: "6000" }),
    fill({ time: MONDAY + DAY, px: "6000", side: "A", sz: "0.5", startPosition: "1" }),
    fill({ time: MONDAY + 2 * DAY, px: "12000", sz: "0.5", startPosition: "0.5" })];
  assert.equal(computeMetrics(fills, [], MONDAY + 4 * DAY).flatShare, 0.25);
});

test("flatShare seeds truncated positions and clips intervals to the coverage window", () => {
  const fills = [fill({ px: "20000", side: "A", sz: "0.5", startPosition: "1" }),
    fill({ time: MONDAY + 20 * DAY, px: "20000", side: "A", sz: "0.5", startPosition: "0.5" })];
  near(computeMetrics(fills, [], MONDAY + 40 * DAY).flatShare, 2 / 3);
});
