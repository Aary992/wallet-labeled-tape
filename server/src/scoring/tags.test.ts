import assert from "node:assert/strict";
import { test } from "node:test";
import { PENDING_TAGS, type AccountMetrics } from "../../../shared/protocol.ts";
import { config } from "../config.ts";
import { assignTags } from "./tags.ts";

const s = config.scoring;
function metrics(overrides: Partial<AccountMetrics> = {}): AccountMetrics {
  return {
    netPnlUsd: s.profitable.minNetPnlUsd + 1, tradedNotionalUsd: 100,
    returnOnVolume: s.profitable.minReturnOnVolume, profitFactor: s.profitable.minProfitFactor,
    maxDrawdownPct: s.profitable.maxDrawdownPct, weeksPositivePct: s.profitable.minWeeksPositivePct,
    closedPositions: s.minClosedPositions, makerShare: 0, fillsPerDay: 0,
    medianHoldSeconds: null, medianPositionNotionalUsd: null, flatShare: 0,
    fillCount: 0, hitFillCap: false, coverageStart: 0, coverageDays: s.fullCoverageDays,
    ...overrides,
  };
}

test("pending is returned by value; tags and metric inputs remain independent", () => {
  const tags = assignTags(null);
  assert.deepEqual(tags, PENDING_TAGS);
  assert.notEqual(tags, PENDING_TAGS);
  const m = metrics();
  const copy = structuredClone(m);
  assignTags(m);
  assert.deepEqual(m, copy);
});

test("history boundaries, sample count and coverage are retained", () => {
  for (const offset of [-1, 0, 1]) {
    const count = s.minClosedPositions + offset;
    const tags = assignTags(metrics({ closedPositions: count }));
    assert.equal(tags.history, offset < 0 ? "insufficient" : "full");
    assert.equal(tags.perf, offset < 0 ? null : "profitable");
    assert.equal(tags.closedPositions, count);
  }
  for (const boundary of [s.minCoverageDays, s.fullCoverageDays]) {
    for (const offset of [-0.01, 0, 0.01]) {
      const days = boundary + offset;
      const tags = assignTags(metrics({ coverageDays: days }));
      assert.equal(tags.history, days < s.minCoverageDays ? "insufficient" : days < s.fullCoverageDays ? "partial" : "full");
      assert.equal(tags.coverageDays, days);
      assert.equal(tags.perf, days < s.minCoverageDays ? null : "profitable");
    }
  }
});

const profitableBoundaries: Array<[keyof AccountMetrics, number, boolean, boolean]> = [
  ["netPnlUsd", s.profitable.minNetPnlUsd, true, false],
  ["profitFactor", s.profitable.minProfitFactor, true, true],
  ["returnOnVolume", s.profitable.minReturnOnVolume, true, true],
  ["maxDrawdownPct", s.profitable.maxDrawdownPct, false, true],
  ["weeksPositivePct", s.profitable.minWeeksPositivePct, true, true],
];
for (const [key, boundary, increasing, inclusive] of profitableBoundaries) {
  test(`profitable ${key}: below, at, and above its configured boundary`, () => {
    for (const offset of [-0.00001, 0, 0.00001]) {
      const passes = offset === 0 ? inclusive : increasing ? offset > 0 : offset < 0;
      assert.equal(assignTags(metrics({ [key]: boundary + offset })).perf, passes ? "profitable" : "mixed");
    }
  });
}

test("unprofitable net PnL and profit factor use strict boundaries", () => {
  for (const offset of [-0.001, 0, 0.001]) {
    assert.equal(assignTags(metrics({ netPnlUsd: s.unprofitable.maxNetPnlUsd + offset,
      profitFactor: s.unprofitable.maxProfitFactor - 0.1 })).perf, offset < 0 ? "unprofitable" : "mixed");
    assert.equal(assignTags(metrics({ netPnlUsd: s.unprofitable.maxNetPnlUsd - 1,
      profitFactor: s.unprofitable.maxProfitFactor + offset })).perf, offset < 0 ? "unprofitable" : "mixed");
  }
  assert.equal(assignTags(metrics({ profitFactor: null })).perf, "mixed");
  assert.equal(assignTags(metrics({ netPnlUsd: -1, profitFactor: null })).perf, "mixed");
});

test("size is strict; insufficient history still allows size and activity", () => {
  for (const offset of [-1, 0, 1]) {
    assert.equal(assignTags(metrics({ medianPositionNotionalUsd: s.large.minMedianPositionNotionalUsd + offset })).size,
      offset > 0 ? "large" : null);
  }
  assert.equal(assignTags(metrics()).size, null);
  const tags = assignTags(metrics({ closedPositions: 0, medianPositionNotionalUsd: s.large.minMedianPositionNotionalUsd + 1,
    fillsPerDay: s.automated.minFillsPerDay, medianHoldSeconds: s.automated.maxMedianHoldSeconds - 1 }));
  assert.equal(tags.perf, null);
  assert.equal(tags.size, "large");
  assert.equal(tags.activity, "automated");
});

test("automated fill rate is inclusive and hold time is strict; null hold does not qualify", () => {
  for (const offset of [-0.01, 0, 0.01]) {
    assert.equal(assignTags(metrics({ fillsPerDay: s.automated.minFillsPerDay + offset,
      medianHoldSeconds: s.automated.maxMedianHoldSeconds - 1 })).activity, offset >= 0 ? "automated" : null);
    assert.equal(assignTags(metrics({ fillsPerDay: s.automated.minFillsPerDay,
      medianHoldSeconds: s.automated.maxMedianHoldSeconds + offset })).activity, offset < 0 ? "automated" : null);
  }
  assert.equal(assignTags(metrics({ fillsPerDay: s.automated.minFillsPerDay, medianHoldSeconds: null })).activity, null);
});

test("both market maker boundaries are inclusive and take precedence over automated", () => {
  for (const key of ["makerShare", "flatShare"] as const) {
    const boundary = key === "makerShare" ? s.marketMaker.minMakerShare : s.marketMaker.minFlatShare;
    for (const offset of [-0.01, 0, 0.01]) {
      const tags = assignTags(metrics({ makerShare: s.marketMaker.minMakerShare, flatShare: s.marketMaker.minFlatShare,
        fillsPerDay: s.automated.minFillsPerDay, medianHoldSeconds: s.automated.maxMedianHoldSeconds - 1,
        [key]: boundary + offset }));
      assert.equal(tags.activity, offset >= 0 ? "market_maker" : "automated");
    }
  }
  assert.equal(assignTags(metrics({ makerShare: s.marketMaker.minMakerShare,
    flatShare: s.marketMaker.minFlatShare })).activity, "market_maker");
});
