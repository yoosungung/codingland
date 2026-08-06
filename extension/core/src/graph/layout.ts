import type { GraphEdge, GraphNode, GraphSnapshot, NodeKind, ZoomLevel } from "./types";

/** Which node kinds are visible at a Semantic Zoom level (§1.3). */
const VISIBLE_KINDS: Record<ZoomLevel, ReadonlySet<NodeKind>> = {
  boundary: new Set(["module", "class", "object"]),
  function: new Set(["module", "class", "object", "function"]),
  detail: new Set(["module", "class", "object", "function"]),
};

/**
 * Copy anchors from prior nodes onto next (same id).
 * New nodes keep any anchor already set; otherwise undefined (caller may place).
 */
export function preserveAnchors(
  prior: readonly GraphNode[],
  next: readonly GraphNode[]
): GraphNode[] {
  const priorMap = new Map(prior.map((n) => [n.id, n]));
  return next.map((n) => {
    const old = priorMap.get(n.id);
    if (old?.anchor) {
      return { ...n, anchor: { ...old.anchor } };
    }
    return n;
  });
}

function filterEdges(
  edges: readonly GraphEdge[],
  visibleIds: ReadonlySet<string>
): GraphEdge[] {
  return edges.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to)
  );
}

/**
 * Semantic Zoom view: hide finer nodes, never relocate surviving landmarks.
 */
export function applySemanticZoom(
  snapshot: GraphSnapshot,
  zoomLevel: ZoomLevel
): GraphSnapshot {
  const allowed = VISIBLE_KINDS[zoomLevel];
  const nodes = snapshot.nodes
    .filter((n) => allowed.has(n.kind))
    .map((n) =>
      n.anchor ? { ...n, anchor: { ...n.anchor } } : { ...n }
    );
  const visibleIds = new Set(nodes.map((n) => n.id));
  return {
    nodes,
    edges: filterEdges(snapshot.edges, visibleIds),
    zoomLevel,
  };
}

/** Deterministic grid anchors for nodes lacking one (stable by id sort). */
export function ensureAnchors(nodes: readonly GraphNode[]): GraphNode[] {
  const gap = 120;
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((n, i) => {
    if (n.anchor) {
      return n;
    }
    const col = i % 4;
    const row = Math.floor(i / 4);
    return { ...n, anchor: { x: col * gap, y: row * gap } };
  });
}
