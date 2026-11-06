import type { PositionAction } from "../../../shared/protocol.ts";
import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";

function normalize(size: number): number {
  return Math.abs(size) < config.positions.zeroEpsilon ? 0 : size;
}

/** Unchanged positions (including flat to flat) have no position action. */
export function classifyAction(before: number, after: number): PositionAction {
  before = normalize(before);
  after = normalize(after);
  if (before === after) return "unknown";
  if (before === 0) return "open";
  if (after === 0) return "close";
  if (Math.sign(before) !== Math.sign(after)) return "flip";
  return Math.abs(after) > Math.abs(before) ? "add" : "reduce";
}

/** Latest by exchange time; input order breaks ties for fills at the same time. */
export function positionsFromFills(fills: HlFill[]): Map<string, number> {
  const latest = new Map<string, HlFill>();
  for (const fill of fills) {
    const previous = latest.get(fill.coin);
    if (!previous || fill.time >= previous.time) latest.set(fill.coin, fill);
  }
  return new Map([...latest].map(([coin, fill]) => [
    coin,
    normalize(Number(fill.startPosition) + (fill.side === "B" ? 1 : -1) * Number(fill.sz)),
  ]));
}

export interface PositionEntry {
  address: string;
  coin: string;
  size: number;
  updatedAt: number;
  needsReconcile: boolean;
}

export class PositionBook {
  // An empty fill history still seeds an account as flat on every coin.
  private positions = new Map<string, Map<string, PositionEntry>>();

  seed(address: string, coin: string, size: number, at: number): void {
    let coins = this.positions.get(address);
    if (!coins) {
      coins = new Map();
      this.positions.set(address, coins);
    }
    coins.set(coin, { address, coin, size: normalize(size), updatedAt: at, needsReconcile: false });
  }

  seedFromFills(address: string, fills: HlFill[], at: number): void {
    if (!this.positions.has(address)) this.positions.set(address, new Map());
    for (const [coin, size] of positionsFromFills(fills)) this.seed(address, coin, size, at);
  }

  apply(address: string, coin: string, signedDelta: number, at: number): PositionAction {
    const coins = this.positions.get(address);
    if (!coins) return "unknown";
    const previous = coins.get(coin);
    const before = previous?.size ?? 0;
    const size = normalize(before + signedDelta);
    coins.set(coin, {
      address, coin, size, updatedAt: at, needsReconcile: previous?.needsReconcile ?? false,
    });
    return classifyAction(before, size);
  }

  /** Missing coins on seeded accounts are flat; unseeded accounts are unknown. */
  get(address: string, coin: string): number | undefined {
    const coins = this.positions.get(address);
    return coins ? coins.get(coin)?.size ?? 0 : undefined;
  }

  /** An authoritative reconcile also establishes that the account is seeded. */
  overwrite(address: string, coin: string, size: number, at: number): void {
    this.seed(address, coin, size, at);
  }

  markNeedsReconcile(addresses?: string[]): void {
    const selected = addresses === undefined ? this.positions.keys() : addresses;
    for (const address of selected) {
      for (const position of this.positions.get(address)?.values() ?? []) {
        position.needsReconcile = true;
      }
    }
  }

  isSeeded(address: string): boolean {
    return this.positions.has(address);
  }

  /** Copies keep persistence consumers from mutating the live book. */
  entries(): PositionEntry[] {
    return [...this.positions.values()].flatMap((coins) =>
      [...coins.values()].map((position) => ({ ...position })));
  }
}
