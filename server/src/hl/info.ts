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
    if (res.status === 429) throw new Error("rate limited (429): budget numbers in config.ts are too high");
    if (!res.ok) throw new Error(`info ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }

  /**
   * One page of fills (max 2,000) from startTime. Weight is charged up front at the base cost;
   * TODO(scorer): charge the per-item extra after the response, once confirmed in the docs.
   */
  userFillsByTime(user: string, startTime: number, endTime?: number): Promise<HlFill[]> {
    return this.post<HlFill[]>(
      { type: "userFillsByTime", user, startTime, endTime, aggregateByTime: false },
      config.budget.userFillsBaseWeight,
    );
  }

  clearinghouseState(user: string): Promise<HlClearinghouseState> {
    return this.post<HlClearinghouseState>(
      { type: "clearinghouseState", user },
      config.budget.clearinghouseStateWeight,
    );
  }
}
