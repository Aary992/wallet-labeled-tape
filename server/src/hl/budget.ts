// Token bucket on REST *weight*, not on requests (PRD: Rate limits). Each call's weight is charged
// before it runs. The scorer gets 1,000 of the 1,200 per minute, leaving headroom.

import { config } from "../config.ts";

export class WeightBudget {
  private tokens: number;
  private lastRefill = Date.now();
  /** Weight spent per call, kept for 60 s so the UI can show "REST budget used". */
  private spent: Array<{ at: number; weight: number }> = [];

  constructor(private readonly perMinute: number = config.budget.scorerWeightPerMinute) {
    this.tokens = perMinute;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.perMinute, this.tokens + (elapsed / 60_000) * this.perMinute);
    this.lastRefill = now;
  }

  /** Waits until `weight` tokens are available, then takes them. */
  async take(weight: number): Promise<void> {
    for (;;) {
      this.refill();
      if (this.tokens >= weight) {
        this.tokens -= weight;
        this.spent.push({ at: Date.now(), weight });
        return;
      }
      const missing = weight - this.tokens;
      const waitMs = Math.ceil((missing / this.perMinute) * 60_000);
      await new Promise((r) => setTimeout(r, Math.max(waitMs, 50)));
    }
  }

  /** Weight spent in the last 60 s as % of the full exchange budget (1,200). */
  usedPct(): number {
    const cutoff = Date.now() - 60_000;
    this.spent = this.spent.filter((s) => s.at >= cutoff);
    const used = this.spent.reduce((sum, s) => sum + s.weight, 0);
    return Math.round((used / config.budget.restWeightPerMinute) * 100);
  }
}
