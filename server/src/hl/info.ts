// REST client for POST /info. Every call goes through the weight budget.

import { config } from "../config.ts";
import type { WeightBudget } from "./budget.ts";
import type { HlClearinghouseState, HlFill } from "./types.ts";

export class InfoClient {
  constructor(private readonly budget: WeightBudget) {}

  private async post<T>(body: unknown, weight: number): Promise<T> {
    await this.budget.take(weight);
    const res = await fetch(config.hyperliquid.infoUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      // Back off once, then let the caller retry.
      await new Promise((r) => setTimeout(r, 10_000));
      throw new Error("rate limited (429): backed off 10 s");
    }
    if (!res.ok) throw new Error(`info ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }

  /**
   * One page of fills (max 2,000) from startTime, oldest first. The base weight is charged up
   * front and the per-item extra (1 per 20 fills) right after the response.
   */
  async userFillsByTime(user: string, startTime: number, endTime?: number): Promise<HlFill[]> {
    const fills = await this.post<HlFill[]>(
      { type: "userFillsByTime", user, startTime, endTime, aggregateByTime: false },
      config.budget.userFillsBaseWeight,
    );
    const extra = Math.floor(fills.length / 20) * config.budget.userFillsWeightPer20Items;
    if (extra > 0) await this.budget.take(extra);
    return fills;
  }

  clearinghouseState(user: string): Promise<HlClearinghouseState> {
    return this.post<HlClearinghouseState>(
      { type: "clearinghouseState", user },
      config.budget.clearinghouseStateWeight,
    );
  }
}
