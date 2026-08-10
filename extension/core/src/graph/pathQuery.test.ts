import { queryGraphPath } from "./pathQuery";
import type { GraphEdge, GraphNode, GraphSnapshot } from "./types";

function node(id: string, fingerprint = `fp-${id}`): GraphNode {
  return {
    id,
    fingerprint,
    kind: "function",
    name: id,
    uri: `file:///${id}.ts`,
    range: { startLine: 1, startCol: 0, endLine: 1, endCol: 1 },
    verifyState: "unverified",
  };
}

function edge(
  id: string,
  from: string,
  to: string,
  confidence?: "extracted" | "inferred"
): GraphEdge {
  return { id, from, to, kind: "calls", confidence };
}

describe("queryGraphPath", () => {
  const snapshot: GraphSnapshot = {
    zoomLevel: "function",
    nodes: [node("a"), node("b"), node("c"), node("d")],
    edges: [
      edge("e1", "a", "b"),
      edge("e2", "b", "c"),
      edge("e3", "a", "d", "inferred"),
      edge("e4", "d", "c", "inferred"),
    ],
  };

  it("returns extracted-only shortest path by default", () => {
    const result = queryGraphPath(snapshot, {
      fromFingerprint: "fp-a",
      toFingerprint: "fp-c",
    });
    expect(result).toEqual({
      nodeIds: ["a", "b", "c"],
      edgeIds: ["e1", "e2"],
      confidence: "extracted",
    });
  });

  it("can include inferred edges when opted in", () => {
    const slim: GraphSnapshot = {
      zoomLevel: "function",
      nodes: [node("a"), node("c"), node("d")],
      edges: [
        edge("e3", "a", "d", "inferred"),
        edge("e4", "d", "c", "inferred"),
      ],
    };
    const none = queryGraphPath(slim, {
      fromFingerprint: "fp-a",
      toFingerprint: "fp-c",
    });
    expect(none.nodeIds).toEqual([]);

    const withInf = queryGraphPath(
      slim,
      { fromFingerprint: "fp-a", toFingerprint: "fp-c" },
      { includeInferred: true }
    );
    expect(withInf.nodeIds).toEqual(["a", "d", "c"]);
    expect(withInf.confidence).toBe("inferred");
  });
});
