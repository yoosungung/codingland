import { applyGraphDelta, type GraphDelta, type GraphSnapshot } from "@codingland/core";

/**
 * Host Canvas merge for workspace ingest deltas (EH-free).
 * Seeds an empty snapshot when the canvas has no graph yet.
 */
export function mergeWorkspaceDelta(
  current: GraphSnapshot | undefined,
  delta: GraphDelta
): GraphSnapshot {
  const base: GraphSnapshot = current ?? {
    nodes: [],
    edges: [],
    zoomLevel: delta.zoomLevel ?? "boundary",
  };
  return applyGraphDelta(base, delta);
}
