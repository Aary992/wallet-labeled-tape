// In-memory view of every account seen on the tape: its tags (Pending until scored) and the
// per-coin position the scorer will keep for position actions.

import { PENDING_TAGS, type AccountTags, type PositionAction } from "../../shared/protocol.ts";

export class AccountBook {
  private tags = new Map<string, AccountTags>();
  private firstSeen = new Map<string, number>();

  /** Returns true the first time an address is seen. */
  observe(address: string, at: number): boolean {
    if (this.firstSeen.has(address)) return false;
    this.firstSeen.set(address, at);
    return true;
  }

  tagsFor(address: string): AccountTags {
    return this.tags.get(address) ?? PENDING_TAGS;
  }

  setTags(address: string, tags: AccountTags): void {
    this.tags.set(address, tags);
  }

  /** TODO(positions.ts): classify from position before and after. Unscored accounts stay "unknown". */
  actionFor(_address: string, _coin: string, _signedSize: number): PositionAction {
    return "unknown";
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
