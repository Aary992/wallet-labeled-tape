import assert from "node:assert/strict";
import { test } from "node:test";
import type { PositionAction } from "../../../shared/protocol.ts";
import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";
import { classifyAction, PositionBook, positionsFromFills } from "./positions.ts";

const epsilon = config.positions.zeroEpsilon;

const actions: Array<[string, number, number, PositionAction]> = [
  ["open long", 0, 2, "open"],
  ["open short", 0, -2, "open"],
  ["add long", 2, 3, "add"],
  ["add short", -2, -3, "add"],
  ["reduce long", 3, 2, "reduce"],
  ["reduce short", -3, -2, "reduce"],
  ["close long", 2, 0, "close"],
  ["close short", -2, 0, "close"],
  ["flip long to short through zero", 2, -3, "flip"],
  ["flip short to long through zero", -2, 3, "flip"],
  ["equal magnitude flip", 2, -2, "flip"],
  ["unchanged long", 2, 2, "unknown"],
  ["unchanged short", -2, -2, "unknown"],
  ["flat to flat", 0, 0, "unknown"],
  ["dust to long", -epsilon / 2, 1, "open"],
  ["long to negative dust", 1, -epsilon / 2, "close"],
  ["short to positive dust", -1, epsilon / 2, "close"],
  ["dust to dust", epsilon / 2, -epsilon / 2, "unknown"],
  ["positive epsilon is nonzero", 0, epsilon, "open"],
  ["negative epsilon is nonzero", -epsilon, 0, "close"],
];

for (const [name, before, after, action] of actions) {
  test(`classifyAction: ${name}`, () => {
    assert.equal(classifyAction(before, after), action);
  });
}

function fill(overrides: Partial<HlFill> = {}): HlFill {
  return {
    coin: "BTC", px: "100", sz: "2", side: "B", time: 1,
    startPosition: "0", dir: "Open Long", closedPnl: "0", hash: "hash",
    oid: 1, crossed: true, fee: "0", tid: 1, ...overrides,
  };
}

test("positionsFromFills uses the latest fill's startPosition and signed size per coin", () => {
  const fills = [
    fill({ time: 3, startPosition: "5", sz: "8", side: "A" }),
    fill({ coin: "ETH", time: 2, startPosition: "-4", sz: "6" }),
    fill({ time: 1, startPosition: "100" }),
    fill({ coin: "SOL", startPosition: "0.3", sz: "0.3", side: "A" }),
  ];
  const original = structuredClone(fills);
  assert.deepEqual(positionsFromFills(fills), new Map([
    ["BTC", -3], ["ETH", 2], ["SOL", 0],
  ]));
  assert.deepEqual(fills, original);
});

test("positionsFromFills preserves input order for equal-time fills and normalizes dust", () => {
  assert.deepEqual(positionsFromFills([
    fill({ startPosition: "1", sz: "2" }),
    fill({ startPosition: "0.3", sz: "0.30000000000000004", side: "A" }),
  ]), new Map([["BTC", 0]]));
  assert.deepEqual(positionsFromFills([]), new Map());
});

test("unseeded accounts return unknown and store nothing", () => {
  const book = new PositionBook();
  assert.equal(book.apply("alice", "BTC", 2, 10), "unknown");
  book.markNeedsReconcile(["alice"]);
  assert.equal(book.get("alice", "BTC"), undefined);
  assert.equal(book.isSeeded("alice"), false);
  assert.deepEqual(book.entries(), []);
});

test("seeded accounts apply every action, including flips in one trade", () => {
  const book = new PositionBook();
  book.seed("alice", "BTC", 0, 1);
  const trades: Array<[number, PositionAction, number]> = [
    [2, "open", 2], [1, "add", 3], [-1, "reduce", 2],
    [-5, "flip", -3], [-1, "add", -4], [1, "reduce", -3],
    [5, "flip", 2], [-2, "close", 0], [-2, "open", -2],
    [2, "close", 0], [0, "unknown", 0],
  ];
  let at = 1;
  for (const [delta, action, size] of trades) {
    at += 1;
    assert.equal(book.apply("alice", "BTC", delta, at), action);
    assert.equal(book.get("alice", "BTC"), size);
    assert.deepEqual(book.entries(), [
      { address: "alice", coin: "BTC", size, updatedAt: at, needsReconcile: false },
    ]);
  }
});

test("seedFromFills seeds each coin and permits opening a previously unseen coin", () => {
  const book = new PositionBook();
  book.seedFromFills("alice", [fill(), fill({ coin: "ETH", side: "A" })], 10);
  assert.equal(book.isSeeded("alice"), true);
  assert.equal(book.get("alice", "BTC"), 2);
  assert.equal(book.get("alice", "ETH"), -2);
  assert.equal(book.get("alice", "SOL"), 0);
  assert.equal(book.apply("alice", "SOL", 4, 11), "open");
  assert.equal(book.get("alice", "SOL"), 4);
  book.seedFromFills("bob", [], 10);
  assert.equal(book.isSeeded("bob"), true);
  assert.equal(book.get("bob", "BTC"), 0);
  assert.equal(book.apply("bob", "BTC", -1, 12), "open");
});

test("seed, apply, and overwrite normalize floating-point dust", () => {
  const book = new PositionBook();
  book.seed("alice", "BTC", -epsilon / 2, 1);
  assert.equal(book.get("alice", "BTC"), 0);
  book.seed("alice", "BTC", 0.3, 2);
  assert.equal(book.apply("alice", "BTC", -0.30000000000000004, 3), "close");
  assert.equal(book.get("alice", "BTC"), 0);
  book.overwrite("alice", "BTC", epsilon / 2, 4);
  assert.equal(book.get("alice", "BTC"), 0);
});

test("reconcile selects accounts, survives apply, and overwrite clears only its coin", () => {
  const book = new PositionBook();
  book.seed("alice", "BTC", 2, 1);
  book.seed("alice", "ETH", -1, 1);
  book.seed("bob", "BTC", 4, 1);
  book.markNeedsReconcile([]);
  assert.ok(book.entries().every((p) => !p.needsReconcile));
  book.markNeedsReconcile(["alice", "missing"]);
  assert.deepEqual(book.entries().map((p) => p.needsReconcile), [true, true, false]);
  book.apply("alice", "BTC", 1, 2);
  assert.equal(book.entries()[0]?.needsReconcile, true);
  book.overwrite("alice", "BTC", 7, 3);
  assert.deepEqual(book.entries(), [
    { address: "alice", coin: "BTC", size: 7, updatedAt: 3, needsReconcile: false },
    { address: "alice", coin: "ETH", size: -1, updatedAt: 1, needsReconcile: true },
    { address: "bob", coin: "BTC", size: 4, updatedAt: 1, needsReconcile: false },
  ]);
  book.markNeedsReconcile();
  assert.ok(book.entries().every((p) => p.needsReconcile));
  assert.equal(book.isSeeded("missing"), false);
});

test("overwrite can seed an account and persistence entries are independent copies", () => {
  const book = new PositionBook();
  book.overwrite("alice", "BTC", 3, 10);
  assert.equal(book.isSeeded("alice"), true);
  const entries = book.entries();
  entries[0]!.size = 100;
  entries[0]!.needsReconcile = true;
  entries.pop();
  assert.deepEqual(book.entries(), [
    { address: "alice", coin: "BTC", size: 3, updatedAt: 10, needsReconcile: false },
  ]);
});
