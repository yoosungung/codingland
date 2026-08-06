import type { GraphDelta, GraphEdge, GraphNode, GraphSnapshot } from "./types";

/**
 * Apply an incremental GraphDelta onto a snapshot (ARCHITECTURE §1.5 / §4.1).
 * Pure: does not mutate `snapshot`.
 */
export function applyGraphDelta(
  snapshot: GraphSnapshot,
  delta: GraphDelta
): GraphSnapshot {
  const nodeMap = new Map<string, GraphNode>(
    snapshot.nodes.map((n) => [n.id, n])
  );
  const edgeMap = new Map<string, GraphEdge>(
    snapshot.edges.map((e) => [e.id, e])
  );

  for (const id of delta.removeNodeIds ?? []) {
    nodeMap.delete(id);
  }
  for (const id of delta.removeEdgeIds ?? []) {
    edgeMap.delete(id);
  }
  for (const n of delta.upsertNodes ?? []) {
    nodeMap.set(n.id, n);
  }
  for (const e of delta.upsertEdges ?? []) {
    edgeMap.set(e.id, e);
  }

  return {
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
    zoomLevel: delta.zoomLevel ?? snapshot.zoomLevel,
  };
}
