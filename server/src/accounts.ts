// In-memory view of every account seen on the tape: its tags (Pending until scored), its metrics
// and when its tags expire. Positions live in scoring/positions.ts.

import { PENDING_TAGS, type AccountMetrics, type AccountTags } from "../../shared/protocol.ts";

export class AccountBook {
  private tags = new Map<string, AccountTags>();
  private firstSeen = new Map<string, number>();
  private metrics = new Map<string, AccountMetrics>();
  private expires = new Map<string, number>();

  /** Returns true the first time an address is seen. */
  observe(address: string, at: number): boolean {
    if (this.firstSeen.has(address)) return false;
    this.firstSeen.set(address, at);
    return true;
  }

  tagsFor(address: string): AccountTags {
    return this.tags.get(address) ?? PENDING_TAGS;
  }

  setTags(address: string, tags: AccountTags, metrics?: AccountMetrics, expiresAt?: number): void {
    this.tags.set(address, tags);
    if (metrics) this.metrics.set(address, metrics);
    if (expiresAt) this.expires.set(address, expiresAt);
  }

  metricsFor(address: string): AccountMetrics | null {
    return this.metrics.get(address) ?? null;
  }

  isSeen(address: string): boolean {
    return this.firstSeen.has(address) || this.tags.has(address);
  }

  /** Scored but past its expiry: the pipeline re-queues it when it trades again. */
  isExpired(address: string, now: number): boolean {
    const at = this.expires.get(address);
    return at !== undefined && at < now;
  }

  get seenCount(): number {
    return this.firstSeen.size;
  }

  get scoredCount(): number {
    let n = 0;
    for (const t of this.tags.values()) if (t.history !== "pending") n += 1;
    return n;
  }
}
