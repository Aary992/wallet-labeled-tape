import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";
import { buildRoundTrips } from "./roundtrips.ts";

function fill(overrides: Partial<HlFill> = {}): HlFill {
  return { coin: "BTC", px: "100", sz: "1", side: "B", time: 1000,
    startPosition: "0", dir: "", closedPnl: "0", hash: "test", oid: 1,
    crossed: true, fee: "0", tid: 1, ...overrides };
}

test("open, add, partial close and full close form one trip with all fees", () => {
  const fills = [
    fill({ sz: "2", fee: "1" }),
    fill({ time: 2000, startPosition: "2", fee: "1", builderFee: "0.5" }),
    fill({ time: 3000, startPosition: "3", side: "A", closedPnl: "10", fee: "-0.5" }),
    fill({ time: 4000, startPosition: "2", side: "A", sz: "2", closedPnl: "20", fee: "2" }),
  ];
  const copy = structuredClone(fills);
  assert.deepEqual(buildRoundTrips(fills), [{ coin: "BTC", openTime: 1000,
    closeTime: 4000, pnlUsd: 26, maxNotionalUsd: 300, fillCount: 4, truncated: false }]);
  assert.deepEqual(fills, copy);
  assert.equal(buildRoundTrips(fills.slice(0, 3))[0]!.closeTime, null);
});

test("flip closes the old trip, splits fees by size and opens the residual", () => {
  const trips = buildRoundTrips([
    fill({ sz: "2", fee: "1" }),
    fill({ time: 2000, startPosition: "2", side: "A", sz: "3", closedPnl: "30", fee: "2", builderFee: "1" }),
    fill({ time: 3000, startPosition: "-1", closedPnl: "5", fee: "1" }),
  ]);
  assert.deepEqual(trips, [
    { coin: "BTC", openTime: 1000, closeTime: 2000, pnlUsd: 27, maxNotionalUsd: 200, fillCount: 2, truncated: false },
    { coin: "BTC", openTime: 2000, closeTime: 3000, pnlUsd: 3, maxNotionalUsd: 100, fillCount: 2, truncated: false },
  ]);
  assert.equal(trips.reduce((sum, trip) => sum + trip.pnlUsd, 0), 30);
});

test("short to long flip leaves an open trip and preserves maker rebates", () => {
  const trips = buildRoundTrips([
    fill({ side: "A" }),
    fill({ time: 2000, side: "B", startPosition: "-1", sz: "2", fee: "-2", closedPnl: "10" }),
  ]);
  assert.equal(trips[0]!.pnlUsd, 11);
  assert.equal(trips[1]!.pnlUsd, 1);
  assert.equal(trips[1]!.closeTime, null);
  assert.equal(trips[1]!.maxNotionalUsd, 100);
});

test("first nonzero position per coin is truncated, even when immediately closed", () => {
  assert.deepEqual(buildRoundTrips([
    fill({ startPosition: "3", side: "A", sz: "3", closedPnl: "7" }),
    fill({ coin: "DOGE", time: 2000, startPosition: "-2", sz: "1" }),
    // Only the FIRST startPosition seeds a coin; subsequent positions are tracked.
    fill({ coin: "DOGE", time: 3000, startPosition: "999" }),
    fill({ time: 4000 }),
  ]), [
    { coin: "BTC", openTime: 1000, closeTime: 1000, pnlUsd: 7, maxNotionalUsd: 300, fillCount: 1, truncated: true },
    { coin: "DOGE", openTime: 2000, closeTime: 3000, pnlUsd: 0, maxNotionalUsd: 200, fillCount: 2, truncated: true },
    { coin: "BTC", openTime: 4000, closeTime: null, pnlUsd: 0, maxNotionalUsd: 100, fillCount: 1, truncated: false },
  ]);
});

test("epsilon absorbs floating point residue but its boundary remains nonzero", () => {
  const epsilon = config.positions.zeroEpsilon;
  assert.deepEqual(buildRoundTrips([fill({ sz: String(epsilon / 2) })]), []);
  assert.equal(buildRoundTrips([fill({ sz: String(epsilon) })]).length, 1);
  const trips = buildRoundTrips([
    fill({ sz: "0.3" }),
    fill({ time: 2000, side: "A", sz: "0.30000000000000004" }),
  ]);
  assert.equal(trips.length, 1);
  assert.equal(trips[0]!.closeTime, 2000);
  assert.equal(buildRoundTrips([fill({ startPosition: String(epsilon / 2) })])[0]!.truncated, false);
});

test("empty history and simultaneous independent coins", () => {
  assert.deepEqual(buildRoundTrips([]), []);
  const trips = buildRoundTrips([fill(), fill({ coin: "ETH", side: "A", sz: "2" })]);
  assert.equal(trips.length, 2);
  assert.deepEqual(trips.map((trip) => [trip.coin, trip.maxNotionalUsd]), [["BTC", 100], ["ETH", 200]]);
});
