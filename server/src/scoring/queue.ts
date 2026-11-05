// Scoring priority queue (PRD: Rate limits). Priority = trade notional x recency, cap of 500,
// accounts under $5k notional are never queued. The scorer (scorer.ts, TODO) pops from here.

import { config } from "../config.ts";

interface Entry {
  address: string;
  notionalUsd: number;
  lastSeen: number;
}

export class ScoreQueue {
  private entries = new Map<string, Entry>();

  /** Offer an account seen in a trade. Re-offers raise its notional and refresh recency. */
  offer(address: string, notionalUsd: number, now = Date.now()): void {
    if (notionalUsd < config.queue.minNotionalUsd && !this.entries.has(address)) return;
    const e = this.entries.get(address);
    if (e) {
      e.notionalUsd = Math.max(e.notionalUsd, notionalUsd);
      e.lastSeen = now;
    } else {
      this.entries.set(address, { address, notionalUsd, lastSeen: now });
    }
    if (this.entries.size > config.queue.maxWaiting) this.dropLowest(now);
  }

  /** Highest priority account, removed from the queue. */
  pop(now = Date.now()): string | null {
    let best: Entry | null = null;
    let bestScore = -1;
    for (const e of this.entries.values()) {
      const s = priority(e, now);
      if (s > bestScore) {
        best = e;
        bestScore = s;
      }
    }
    if (!best) return null;
    this.entries.delete(best.address);
    return best.address;
  }

  has(address: string): boolean {
    return this.entries.has(address);
  }

  get size(): number {
    return this.entries.size;
  }

  private dropLowest(now: number): void {
    let worst: Entry | null = null;
    let worstScore = Infinity;
    for (const e of this.entries.values()) {
      const s = priority(e, now);
      if (s < worstScore) {
        worst = e;
        worstScore = s;
      }
    }
    if (worst) this.entries.delete(worst.address);
  }
}

/** Recency decays with a 10 minute half-life, so a $500k print from now beats one from an hour ago. */
function priority(e: Entry, now: number): number {
  const ageMin = (now - e.lastSeen) / 60_000;
  return e.notionalUsd * Math.pow(0.5, ageMin / 10);
}
