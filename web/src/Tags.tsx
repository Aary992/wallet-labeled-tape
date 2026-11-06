import type { AccountTags, PositionAction } from "../../shared/protocol.ts";

/** The three independent axes plus history. Pending accounts never get a guessed tag. */
export function Tags({ tags }: { tags: AccountTags }) {
  if (tags.history === "pending") {
    return (
      <span className="tag pending">
        <span className="spinner" />
        Pending
      </span>
    );
  }
  return (
    <>
      {tags.history === "insufficient" && <span className="tag dim">Insufficient history</span>}
      {tags.perf === "profitable" && <span className="tag good">Profitable (30d)</span>}
      {tags.perf === "unprofitable" && <span className="tag bad">Unprofitable (30d)</span>}
      {tags.perf === "mixed" && <span className="tag dim">Mixed (30d)</span>}
      {tags.history === "partial" && tags.coverageDays !== null && (
        <span className="tag dim">covers {Math.floor(tags.coverageDays)}d</span>
      )}
      {tags.size === "large" && <span className="tag size">Large</span>}
      {tags.activity === "automated" && <span className="tag act">Likely automated</span>}
      {tags.activity === "market_maker" && <span className="tag act">Likely market maker</span>}
    </>
  );
}

export function Action({ action }: { action: PositionAction }) {
  if (action === "unknown") return <span className="action unknown">action unknown</span>;
  return <span className={`action ${action}`}>{action}</span>;
}
