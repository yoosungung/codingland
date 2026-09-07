import { MAX_CANVAS_NODES, buildCanvasViewDelta } from "./canvasViewDelta";
import type { GraphNode, GraphSnapshot } from "@codingland/core";

function node(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    fingerprint: `fp-${id}`,
    kind: "function",
    name: id,
    uri: `file:///${id}.ts`,
    range: { startLine: 1, startCol: 0, endLine: 1, endCol: 1 },
    verifyState: "unverified",
    ...overrides,
  };
}

function snapshot(count: number): GraphSnapshot {
  return {
    nodes: Array.from({ length: count }, (_, i) => node(`n${i}`)),
    edges: [],
    zoomLevel: "function",
  };
}

describe("buildCanvasViewDelta", () => {
  it("caps upsertNodes and sets truncated after uncapped merge-sized snapshot", () => {
    const full = snapshot(MAX_CANVAS_NODES + 3);
    const payload = buildCanvasViewDelta(full);

    expect(payload.upsertNodes).toHaveLength(MAX_CANVAS_NODES);
    expect(payload.truncated).toBe(true);
    expect(payload.zoomLevel).toBe("function");
    expect(payload.removeNodeIds).toEqual([]);
    expect(payload.removeEdgeIds).toEqual([]);
  });

  it("does not set truncated when view fits under the cap", () => {
    const full = snapshot(2);
    const payload = buildCanvasViewDelta(full);

    expect(payload.upsertNodes).toHaveLength(2);
    expect(payload.truncated).toBe(false);
  });
});
