import {
  applySemanticZoom,
  type GraphDelta,
  type GraphSnapshot,
  type ZoomLevel,
} from "@codingland/core";

/** Cap DOM nodes posted to Canvas webview (avoid EH freeze on huge graphs). */
export const MAX_CANVAS_NODES = 500;

/** Payload posted as GRAPH_DELTA after zoom+cap (shared by push + incremental). */
export type CanvasViewDeltaPayload = GraphDelta & { truncated: boolean };

/** Build capped Canvas view from in-memory snapshot (EH-free). */
export function buildCanvasViewDelta(
  full: GraphSnapshot,
  zoomLevel?: ZoomLevel
): CanvasViewDeltaPayload {
  const level = zoomLevel ?? full.zoomLevel;
  const view = applySemanticZoom(full, level);
  const nodes = view.nodes.slice(0, MAX_CANVAS_NODES);
  return {
    upsertNodes: nodes,
    upsertEdges: view.edges,
    removeNodeIds: [],
    removeEdgeIds: [],
    zoomLevel: view.zoomLevel,
    truncated: view.nodes.length > MAX_CANVAS_NODES,
  };
}
