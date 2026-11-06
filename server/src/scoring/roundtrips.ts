import { config } from "../config.ts";
import type { HlFill } from "../hl/types.ts";

export interface RoundTrip {
  coin: string;
  /** First observed fill time; a truncated trip's actual entry predates history. */
  openTime: number;
  closeTime: number | null;
  pnlUsd: number;
  maxNotionalUsd: number;
  fillCount: number;
  truncated: boolean;
}

function position(size: number): number {
  return Math.abs(size) < config.positions.zeroEpsilon ? 0 : size;
}

/** Reconstruct independent coin positions without mutating fills. */
export function buildRoundTrips(fills: HlFill[]): RoundTrip[] {
  const trips: RoundTrip[] = [];
  const states = new Map<string, { size: number; trip: RoundTrip | null }>();
  function open(fill: HlFill, size: number, truncated: boolean): RoundTrip {
    const trip: RoundTrip = {
      coin: fill.coin, openTime: fill.time, closeTime: null, pnlUsd: 0,
      maxNotionalUsd: Math.abs(size) * Number(fill.px), fillCount: 0, truncated,
    };
    trips.push(trip);
    return trip;
  }

  for (const fill of fills) {
    let state = states.get(fill.coin);
    if (!state) {
      const size = position(Number(fill.startPosition));
      state = { size, trip: size === 0 ? null : open(fill, size, true) };
      states.set(fill.coin, state);
    }
    const before = state.size;
    const delta = (fill.side === "B" ? 1 : -1) * Number(fill.sz);
    const after = position(before + delta);
    const fees = Number(fill.fee) + Number(fill.builderFee ?? 0);
    const closedPnl = Number(fill.closedPnl);
    const flipped = before * after < 0;
    if (!state.trip && after !== 0) state.trip = open(fill, after, false);
    const trip = state.trip;
    if (trip) {
      // A flip realizes PnL on the old position. Split only the fees by size so
      // neither fees nor realized PnL are double counted across the two trips.
      const closingShare = flipped ? Math.abs(before / delta) : 1;
      trip.pnlUsd += closedPnl - fees * closingShare;
      trip.fillCount++;
      trip.maxNotionalUsd = Math.max(trip.maxNotionalUsd,
        Math.abs(before) * Number(fill.px), flipped ? 0 : Math.abs(after) * Number(fill.px));
      if (after === 0 || flipped) {
        trip.closeTime = fill.time;
        state.trip = null;
      }
      if (flipped) {
        state.trip = open(fill, after, false);
        state.trip.pnlUsd = -fees * (1 - closingShare);
        state.trip.fillCount = 1;
      }
    }
    state.size = after;
  }
  return trips;
}
