import { mergeWorkspaceDelta } from "./workspaceGraphMerge";
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

describe("mergeWorkspaceDelta", () => {
  it("seeds empty snapshot when current is undefined, then merges upserts", () => {
    const a = node("a");
    const merged = mergeWorkspaceDelta(undefined, {
      upsertNodes: [a],
      upsertEdges: [],
      zoomLevel: "function",
    });
    expect(merged.nodes).toHaveLength(1);
    expect(merged.nodes[0].id).toBe("a");
    expect(merged.zoomLevel).toBe("function");
  });

  it("merges incremental delta onto existing snapshot without mutating it", () => {
    const current: GraphSnapshot = {
      nodes: [node("a")],
      edges: [],
      zoomLevel: "boundary",
    };
    const merged = mergeWorkspaceDelta(current, {
      upsertNodes: [node("b")],
      removeNodeIds: ["a"],
    });
    expect(current.nodes.map((n) => n.id)).toEqual(["a"]);
    expect(merged.nodes.map((n) => n.id)).toEqual(["b"]);
    expect(merged.zoomLevel).toBe("boundary");
  });
});
