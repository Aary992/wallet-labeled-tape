// Scorer loop: pops the highest-priority account, fetches its last 30 days of fills within the
// REST weight budget, scores it with the X01 functions and seeds its positions (X02).

import { config } from "../config.ts";
import type { AccountMetrics, AccountTags } from "../../../shared/protocol.ts";
import type { HlFill } from "../hl/types.ts";
import { buildRoundTrips } from "./roundtrips.ts";
import { computeMetrics } from "./metrics.ts";
import { assignTags } from "./tags.ts";
import type { PositionBook } from "./positions.ts";
import type { ScoreQueue } from "./queue.ts";

export interface FillSource {
  userFillsByTime(user: string, startTime: number, endTime?: number): Promise<HlFill[]>;
}

export interface ScoredAccount {
  address: string;
  tags: AccountTags;
  metrics: AccountMetrics;
  scoredAt: number;
  expiresAt: number;
  lastFillTime: number | null;
}

const DAY_MS = 86_400_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pages forward from the window start until a short page or the reachable cap. Oldest first. */
export async function fetchWindow(
  source: FillSource,
  address: string,
  now: number,
): Promise<{ fills: HlFill[]; earlyStopped: boolean }> {
  const fills: HlFill[] = [];
  let start = now - config.scoring.windowDays * DAY_MS;
  let earlyStopped = false;
  while (fills.length < config.fills.maxReachable) {
    const page = await source.userFillsByTime(address, start, now);
    fills.push(...page);
    if (page.length < config.fills.maxPerCall) break;
    // A full page that covers under a day means a bot or market maker: 10,000 fills will not reach
    // the minimum history, so stop here and save the budget (docs/ARCHITECTURE.md, early stop).
    const span = (page[page.length - 1]!.time - page[0]!.time) / 3_600_000;
    if (fills.length === page.length && span < config.scorer.earlyStopMinSpanHours) {
      earlyStopped = true;
      break;
    }
    start = page[page.length - 1]!.time + 1;
  }
  fills.sort((a, b) => a.time - b.time || a.tid - b.tid);
  return { fills, earlyStopped };
}

export function scoreFills(address: string, fills: HlFill[], earlyStopped: boolean, now: number): ScoredAccount {
  const metrics = computeMetrics(fills, buildRoundTrips(fills), now);
  let tags = assignTags(metrics);
  // An early-stopped account has one page of history: never give it a performance tag.
  if (earlyStopped) tags = { ...tags, history: "insufficient", perf: null };
  return {
    address,
    tags,
    metrics,
    scoredAt: now,
    expiresAt: now + config.freshness.otherTtlMs,
    lastFillTime: fills.length ? fills[fills.length - 1]!.time : null,
  };
}

export class Scorer {
  private running = false;
  private failures = new Map<string, number>();

  constructor(
    private readonly queue: ScoreQueue,
    private readonly source: FillSource,
    private readonly positions: PositionBook,
    private readonly onScored: (scored: ScoredAccount) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private async loop(): Promise<void> {
    while (this.running) {
      const address = this.queue.pop();
      if (!address) {
        await sleep(config.scorer.idlePollMs);
        continue;
      }
      try {
        const now = Date.now();
        const { fills, earlyStopped } = await fetchWindow(this.source, address, now);
        const scored = scoreFills(address, fills, earlyStopped, now);
        this.positions.seedFromFills(address, fills, now);
        this.failures.delete(address);
        this.onScored(scored);
      } catch (err) {
        const n = (this.failures.get(address) ?? 0) + 1;
        this.failures.set(address, n);
        console.warn(`[scorer] ${address.slice(0, 10)} failed (${n}/${config.scorer.maxRetries}): ${(err as Error).message}`);
        if (n < config.scorer.maxRetries) this.queue.offer(address, config.queue.minNotionalUsd, Date.now());
        await sleep(2_000);
      }
    }
  }
}
