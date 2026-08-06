import { applyGraphDelta } from "./delta";
import type { GraphNode, GraphSnapshot } from "./types";

function node(
  id: string,
  overrides: Partial<GraphNode> = {}
): GraphNode {
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

function emptySnapshot(zoomLevel: GraphSnapshot["zoomLevel"] = "boundary"): GraphSnapshot {
  return { nodes: [], edges: [], zoomLevel };
}

describe("applyGraphDelta", () => {
  it("does not mutate the original snapshot", () => {
    const snap = emptySnapshot();
    const n = node("a");
    const next = applyGraphDelta(snap, { upsertNodes: [n] });
    expect(snap.nodes).toHaveLength(0);
    expect(next.nodes).toHaveLength(1);
  });

  it("upserts nodes and edges, then removes by id", () => {
    const a = node("a");
    const b = node("b");
    let snap = applyGraphDelta(emptySnapshot(), {
      upsertNodes: [a, b],
      upsertEdges: [{ id: "e1", from: "a", to: "b", kind: "calls" }],
    });
    expect(snap.nodes.map((n) => n.id).sort()).toEqual(["a", "b"]);
    expect(snap.edges).toHaveLength(1);

    snap = applyGraphDelta(snap, {
      upsertNodes: [{ ...a, name: "A-renamed" }],
      removeNodeIds: ["b"],
      removeEdgeIds: ["e1"],
    });
    expect(snap.nodes).toHaveLength(1);
    expect(snap.nodes[0].name).toBe("A-renamed");
    expect(snap.edges).toHaveLength(0);
  });

  it("updates zoomLevel when provided", () => {
    const snap = applyGraphDelta(emptySnapshot("boundary"), {
      zoomLevel: "function",
    });
    expect(snap.zoomLevel).toBe("function");
  });

  it("preserves zoomLevel when delta omits it", () => {
    const snap = applyGraphDelta(emptySnapshot("detail"), {
      upsertNodes: [node("x")],
    });
    expect(snap.zoomLevel).toBe("detail");
  });
});
