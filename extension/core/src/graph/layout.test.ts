import { applySemanticZoom, preserveAnchors } from "./layout";
import type { GraphNode, GraphSnapshot } from "./types";

function node(
  id: string,
  overrides: Partial<GraphNode> = {}
): GraphNode {
  return {
    id,
    fingerprint: `fp-${id}`,
    kind: "module",
    name: id,
    uri: `file:///${id}.ts`,
    range: { startLine: 1, startCol: 0, endLine: 1, endCol: 1 },
    verifyState: "unverified",
    ...overrides,
  };
}

describe("preserveAnchors", () => {
  it("keeps prior anchors for matching ids (Mental-Map Preserving)", () => {
    const prior = [
      node("mod", { anchor: { x: 10, y: 20 }, kind: "module" }),
      node("cls", { anchor: { x: 30, y: 40 }, kind: "class", parentId: "mod" }),
    ];
    const next = [
      node("mod", { kind: "module" }),
      node("cls", { kind: "class", parentId: "mod" }),
      node("fn", { kind: "function", parentId: "cls" }),
    ];
    const merged = preserveAnchors(prior, next);
    expect(merged.find((n) => n.id === "mod")?.anchor).toEqual({ x: 10, y: 20 });
    expect(merged.find((n) => n.id === "cls")?.anchor).toEqual({ x: 30, y: 40 });
    expect(merged.find((n) => n.id === "fn")?.anchor).toBeUndefined();
  });
});

describe("applySemanticZoom", () => {
  it("boundary hides function nodes but keeps module/class anchors", () => {
    const snap: GraphSnapshot = {
      zoomLevel: "function",
      nodes: [
        node("mod", { kind: "module", anchor: { x: 1, y: 2 } }),
        node("cls", {
          kind: "class",
          parentId: "mod",
          anchor: { x: 3, y: 4 },
        }),
        node("fn", { kind: "function", parentId: "cls", anchor: { x: 5, y: 6 } }),
      ],
      edges: [
        { id: "c1", from: "mod", to: "cls", kind: "contains" },
        { id: "c2", from: "cls", to: "fn", kind: "contains" },
      ],
    };

    const zoomed = applySemanticZoom(snap, "boundary");
    expect(zoomed.zoomLevel).toBe("boundary");
    expect(zoomed.nodes.map((n) => n.id).sort()).toEqual(["cls", "mod"]);
    expect(zoomed.nodes.find((n) => n.id === "mod")?.anchor).toEqual({
      x: 1,
      y: 2,
    });
    expect(zoomed.nodes.find((n) => n.id === "cls")?.anchor).toEqual({
      x: 3,
      y: 4,
    });
  });

  it("function zoom reveals child functions without moving landmarks", () => {
    const snap: GraphSnapshot = {
      zoomLevel: "boundary",
      nodes: [
        node("mod", { kind: "module", anchor: { x: 1, y: 2 } }),
        node("cls", {
          kind: "class",
          parentId: "mod",
          anchor: { x: 3, y: 4 },
        }),
        node("fn", { kind: "function", parentId: "cls" }),
      ],
      edges: [
        { id: "c1", from: "mod", to: "cls", kind: "contains" },
        { id: "c2", from: "cls", to: "fn", kind: "contains" },
      ],
    };

    const zoomed = applySemanticZoom(snap, "function");
    expect(zoomed.nodes.map((n) => n.id).sort()).toEqual(["cls", "fn", "mod"]);
    expect(zoomed.nodes.find((n) => n.id === "mod")?.anchor).toEqual({
      x: 1,
      y: 2,
    });
    expect(zoomed.nodes.find((n) => n.id === "cls")?.anchor).toEqual({
      x: 3,
      y: 4,
    });
  });
});
