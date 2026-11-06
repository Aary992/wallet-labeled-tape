import { PENDING_TAGS, type AccountMetrics, type AccountTags } from "../../../shared/protocol.ts";
import { config } from "../config.ts";

export function assignTags(m: AccountMetrics | null): AccountTags {
  if (m === null) return { ...PENDING_TAGS };
  const s = config.scoring;
  const history = m.closedPositions < s.minClosedPositions || m.coverageDays < s.minCoverageDays
    ? "insufficient" : m.coverageDays < s.fullCoverageDays ? "partial" : "full";
  const profitable = m.netPnlUsd > s.profitable.minNetPnlUsd
    && m.profitFactor !== null && m.profitFactor >= s.profitable.minProfitFactor
    && m.returnOnVolume >= s.profitable.minReturnOnVolume
    && m.maxDrawdownPct <= s.profitable.maxDrawdownPct
    && m.weeksPositivePct >= s.profitable.minWeeksPositivePct;
  const unprofitable = m.netPnlUsd < s.unprofitable.maxNetPnlUsd
    && m.profitFactor !== null && m.profitFactor < s.unprofitable.maxProfitFactor;
  return {
    history,
    perf: history === "insufficient" ? null : profitable ? "profitable" : unprofitable ? "unprofitable" : "mixed",
    size: m.medianPositionNotionalUsd !== null && m.medianPositionNotionalUsd > s.large.minMedianPositionNotionalUsd ? "large" : null,
    activity: m.makerShare >= s.marketMaker.minMakerShare && m.flatShare >= s.marketMaker.minFlatShare
      ? "market_maker"
      : m.fillsPerDay >= s.automated.minFillsPerDay && m.medianHoldSeconds !== null
        && m.medianHoldSeconds < s.automated.maxMedianHoldSeconds ? "automated" : null,
    coverageDays: m.coverageDays,
    closedPositions: m.closedPositions,
  };
}
