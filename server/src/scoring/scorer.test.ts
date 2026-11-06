import test from "node:test";
import assert from "node:assert/strict";
import { fetchWindow, scoreFills, type FillSource } from "./scorer.ts";
import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";

const NOW = 1_800_000_000_000;
const fill = (time: number, tid: number): HlFill => ({
  coin: "ETH", px: "3000", sz: "1", side: tid % 2 ? "B" : "A", time, startPosition: tid % 2 ? "0" : "1",
  dir: "", closedPnl: tid % 2 ? "0" : "10", hash: "0x", oid: tid, crossed: true, fee: "0.1", tid,
});

/** Serves `total` fills spaced `gapMs` apart, oldest first, honouring startTime and the page size. */
function source(total: number, gapMs: number) {
  const all = Array.from({ length: total }, (_, i) => fill(NOW - (total - i) * gapMs, i));
  const calls: number[] = [];
  const s: FillSource = {
    async userFillsByTime(_user, startTime) {
      calls.push(startTime);
      return all.filter((f) => f.time >= startTime).slice(0, config.fills.maxPerCall);
    },
  };
  return { s, calls };
}

test("pages forward until a short page", async () => {
  const { s, calls } = source(4_500, 5 * 60_000); // 4,500 fills over ~15 days
  const { fills, earlyStopped } = await fetchWindow(s, "0xa", NOW);
  assert.equal(fills.length, 4_500);
  assert.equal(calls.length, 3);
  assert.equal(earlyStopped, false);
});

test("stops at the 10,000 reachable fills", async () => {
  const { s, calls } = source(14_000, 2 * 60_000);
  const { fills } = await fetchWindow(s, "0xa", NOW);
  assert.equal(fills.length, config.fills.maxReachable);
  assert.equal(calls.length, 5);
});

test("early stop: a full first page under a day never gets a performance tag", async () => {
  const { s, calls } = source(9_000, 10_000); // 2,000 fills in ~5.5 hours
  const { fills, earlyStopped } = await fetchWindow(s, "0xa", NOW);
  assert.equal(earlyStopped, true);
  assert.equal(calls.length, 1);
  const scored = scoreFills("0xa", fills, earlyStopped, NOW);
  assert.equal(scored.tags.history, "insufficient");
  assert.equal(scored.tags.perf, null);
});
