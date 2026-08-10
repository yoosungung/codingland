import { isExtracted } from "./edgeConfidence";
import type {
  GraphPathQuery,
  GraphPathResult,
  GraphSnapshot,
} from "./types";

export interface PathQueryOptions {
  /** Default false — extracted edges only (ARCHITECTURE §4.1). */
  includeInferred?: boolean;
}

/**
 * In-process shortest path for Walkthrough / ChangeScore hints
 * (Graphify path/query concept — no external CLI).
 */
export function queryGraphPath(
  snapshot: GraphSnapshot,
  query: GraphPathQuery,
  options: PathQueryOptions = {}
): GraphPathResult {
  const includeInferred = options.includeInferred === true;
  const byFp = new Map(snapshot.nodes.map((n) => [n.fingerprint, n.id]));
  const fromId = byFp.get(query.fromFingerprint);
  const toId = byFp.get(query.toFingerprint);
  if (!fromId || !toId) {
    return { nodeIds: [], edgeIds: [], confidence: "extracted" };
  }
  if (fromId === toId) {
    return { nodeIds: [fromId], edgeIds: [], confidence: "extracted" };
  }

  type Adj = { to: string; edgeId: string; inferred: boolean };
  const adj = new Map<string, Adj[]>();
  for (const e of snapshot.edges) {
    const inferred = !isExtracted(e.confidence);
    if (inferred && !includeInferred) {
      continue;
    }
    const list = adj.get(e.from) ?? [];
    list.push({ to: e.to, edgeId: e.id, inferred });
    adj.set(e.from, list);
  }

  const queue: string[] = [fromId];
  const prev = new Map<string, { from: string; edgeId: string; inferred: boolean }>();
  const seen = new Set<string>([fromId]);
  let found = false;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === toId) {
      found = true;
      break;
    }
    for (const step of adj.get(cur) ?? []) {
      if (seen.has(step.to)) {
        continue;
      }
      seen.add(step.to);
      prev.set(step.to, {
        from: cur,
        edgeId: step.edgeId,
        inferred: step.inferred,
      });
      queue.push(step.to);
    }
  }

  if (!found) {
    return { nodeIds: [], edgeIds: [], confidence: "extracted" };
  }

  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let usedInferred = false;
  let cur: string | undefined = toId;
  while (cur && cur !== fromId) {
    nodeIds.unshift(cur);
    const p = prev.get(cur);
    if (!p) {
      break;
    }
    edgeIds.unshift(p.edgeId);
    usedInferred = usedInferred || p.inferred;
    cur = p.from;
  }
  nodeIds.unshift(fromId);

  return {
    nodeIds,
    edgeIds,
    confidence: usedInferred ? "inferred" : "extracted",
  };
}
