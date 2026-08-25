import { extractAndMergeSources } from "./extractMulti";
import { toGraphStoreSnapshot } from "../graph/graphStore";

describe("extractAndMergeSources (multi-file)", () => {
  it("merges two TS files with uriIndex", () => {
    const { store, stats } = extractAndMergeSources([
      {
        source: "export function foo() { return 1; }",
        uri: "file:///proj/lib/foo.ts",
        fileName: "foo.ts",
      },
      {
        source: "export function bar() { return foo(); }",
        uri: "file:///proj/lib/bar.ts",
        fileName: "bar.ts",
      },
    ]);

    const snap = toGraphStoreSnapshot(store);
    expect(stats.filesTouched).toBe(2);
    expect(snap.graph.nodes.filter((n) => n.uri.includes("foo.ts")).length).toBeGreaterThan(0);
    expect(snap.graph.nodes.filter((n) => n.uri.includes("bar.ts")).length).toBeGreaterThan(0);
    expect(Object.keys(snap.uriIndex)).toHaveLength(2);
  });

  it("skips excluded paths when provided", () => {
    const { store, stats } = extractAndMergeSources(
      [
        {
          source: "export const x = 1;",
          uri: "file:///proj/node_modules/pkg/index.ts",
          fileName: "index.ts",
          relativePath: "node_modules/pkg/index.ts",
        },
        {
          source: "export const y = 2;",
          uri: "file:///proj/src/app.ts",
          fileName: "app.ts",
          relativePath: "src/app.ts",
        },
      ],
      { applyExclude: true }
    );

    const snap = toGraphStoreSnapshot(store);
    expect(stats.filesTouched).toBe(1);
    expect(stats.filesSkipped).toBe(1);
    expect(snap.graph.nodes.every((n) => !n.uri.includes("node_modules"))).toBe(true);
  });
});
