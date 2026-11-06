import test from "node:test";
import assert from "node:assert/strict";
import { FlowTracker, type FlowEvent } from "./flow.ts";

const NOW = 1_800_000_000_000;
const ev = (p: Partial<FlowEvent>): FlowEvent => ({
  time: NOW, coin: "ETH", address: "0xa", signedNotionalUsd: 0, sizeUsd: 100, scored: true, profitable: true, ...p,
});

test("each profitable account counts once by its net change", () => {
  const f = new FlowTracker();
  f.record(ev({ address: "0xwhale", signedNotionalUsd: 1_000_000, sizeUsd: 1_000_000 }));
  f.record(ev({ address: "0xwhale", signedNotionalUsd: 500_000, sizeUsd: 500_000 }));
  f.record(ev({ address: "0xb", signedNotionalUsd: -200 }));
  f.record(ev({ address: "0xc", signedNotionalUsd: 300 }));
  f.record(ev({ address: "0xc", signedNotionalUsd: -500 }));
  const eth = f.snapshot(["ETH"], NOW)[0]!;
  assert.equal(eth.raised, 1);
  assert.equal(eth.cut, 2);
});

test("unprofitable accounts do not count; coverage uses scored notional", () => {
  const f = new FlowTracker();
  f.record(ev({ address: "0xa", signedNotionalUsd: 100, sizeUsd: 300, profitable: false }));
  f.record(ev({ address: "0xb", signedNotionalUsd: -100, sizeUsd: 100, scored: false, profitable: false }));
  const eth = f.snapshot(["ETH"], NOW)[0]!;
  assert.equal(eth.raised + eth.cut, 0);
  assert.equal(eth.coveragePct, 75);
});

test("events older than the window drop out, coins stay separate", () => {
  const f = new FlowTracker();
  f.record(ev({ time: NOW - 16 * 60_000, signedNotionalUsd: 100 }));
  f.record(ev({ coin: "BTC", address: "0xd", signedNotionalUsd: 100 }));
  const [btc, eth] = f.snapshot(["BTC", "ETH"], NOW);
  assert.equal(btc!.raised, 1);
  assert.equal(eth!.raised, 0);
  assert.equal(eth!.coveragePct, 0);
});
