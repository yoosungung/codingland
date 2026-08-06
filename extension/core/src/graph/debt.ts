import { isExtracted } from "./edgeConfidence";
import type { GraphSnapshot } from "./types";

/** Sidebar Debt Meter payload — ARCHITECTURE §5 `debt.updated`. */
export interface DebtCounts {
  unverified: number;
  verified: number;
  bypassed: number;
}

/**
 * Aggregate epistemic debt from graph nodes.
 * Only `extracted` (default) nodes count — inferred are excluded (§1.14).
 */
export function aggregateDebt(snapshot: GraphSnapshot): DebtCounts {
  const counts: DebtCounts = { unverified: 0, verified: 0, bypassed: 0 };
  for (const n of snapshot.nodes) {
    if (!isExtracted(n.confidence)) {
      continue;
    }
    counts[n.verifyState] += 1;
  }
  return counts;
}
