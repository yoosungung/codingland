import { aggregateDebt } from "./debt";
import type { GraphEdge, GraphNode, GraphSnapshot } from "./types";

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

function edge(
  id: string,
  overrides: Partial<GraphEdge> = {}
): GraphEdge {
  return {
    id,
    from: "a",
    to: "b",
    kind: "calls",
    ...overrides,
  };
}

function snap(
  nodes: GraphNode[],
  edges: GraphEdge[] = []
): GraphSnapshot {
  return { nodes, edges, zoomLevel: "boundary" };
}

describe("aggregateDebt", () => {
  it("defaults missing confidence to extracted and counts by verifyState", () => {
    const counts = aggregateDebt(
      snap([
        node("u", { verifyState: "unverified" }),
        node("v", { verifyState: "verified" }),
        node("b", { verifyState: "bypassed" }),
      ])
    );
    expect(counts).toEqual({ unverified: 1, verified: 1, bypassed: 1 });
  });

  it("ignores inferred nodes for Debt totals", () => {
    const counts = aggregateDebt(
      snap([
        node("ex", { verifyState: "unverified", confidence: "extracted" }),
        node("inf", { verifyState: "unverified", confidence: "inferred" }),
        node("inf2", { verifyState: "verified", confidence: "inferred" }),
      ])
    );
    expect(counts).toEqual({ unverified: 1, verified: 0, bypassed: 0 });
  });

  it("does not count edges toward Debt meter (nodes only)", () => {
    const counts = aggregateDebt(
      snap(
        [node("a", { verifyState: "verified", confidence: "extracted" })],
        [
          edge("e1", { confidence: "inferred" }),
          edge("e2", { confidence: "extracted" }),
        ]
      )
    );
    expect(counts).toEqual({ unverified: 0, verified: 1, bypassed: 0 });
  });
});
