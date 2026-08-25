import { extractGraphFromSource } from "../ast/extract";
import {
  createGraphStore,
  findNodeByFingerprint,
  getUriIndexEntry,
  mergeFileIntoStore,
  mergeFilesIntoStore,
  removeUriFromStore,
  toGraphStoreSnapshot,
} from "./graphStore";

describe("GraphStore", () => {
  const fileA = {
    source: "export function alpha() { return beta(); }\nfunction beta() { return 1; }",
    uri: "file:///ws/src/a.ts",
    fileName: "a.ts",
  };
  const fileB = {
    source: "export class Widget { run() { return 42; } }",
    uri: "file:///ws/src/b.ts",
    fileName: "b.ts",
  };

  it("starts empty", () => {
    const store = createGraphStore();
    const snap = toGraphStoreSnapshot(store);
    expect(snap.graph.nodes).toHaveLength(0);
    expect(snap.graph.edges).toHaveLength(0);
    expect(snap.uriIndex).toEqual({});
  });

  it("merges a single file and indexes uri", () => {
    const store = createGraphStore();
    const { store: next, delta } = mergeFileIntoStore(store, fileA);
    const snap = toGraphStoreSnapshot(next);

    expect(snap.graph.nodes.length).toBeGreaterThan(0);
    expect(getUriIndexEntry(next, fileA.uri)?.nodeIds.length).toBe(
      snap.graph.nodes.length
    );
    expect(delta.upsertNodes?.length).toBe(snap.graph.nodes.length);
    expect(delta.removeNodeIds ?? []).toHaveLength(0);
  });

  it("merges multiple files into one graph", () => {
    const store = createGraphStore();
    const { store: merged } = mergeFilesIntoStore(store, [fileA, fileB]);
    const snap = toGraphStoreSnapshot(merged);

    expect(snap.graph.nodes.some((n) => n.uri === fileA.uri)).toBe(true);
    expect(snap.graph.nodes.some((n) => n.uri === fileB.uri)).toBe(true);
    expect(getUriIndexEntry(merged, fileA.uri)).toBeDefined();
    expect(getUriIndexEntry(merged, fileB.uri)).toBeDefined();
  });

  it("replaces prior extract for the same uri (incremental)", () => {
    let store = createGraphStore();
    const first = mergeFileIntoStore(store, fileA);
    store = first.store;
    const before = toGraphStoreSnapshot(store).graph.nodes.length;

    const revised = {
      ...fileA,
      source: "export function onlyOne() { return 1; }",
    };
    const second = mergeFileIntoStore(store, revised);
    const snap = toGraphStoreSnapshot(second.store);

    expect(second.delta.removeNodeIds?.length).toBe(before);
    expect(snap.graph.nodes.every((n) => n.uri === fileA.uri)).toBe(true);
    expect(snap.graph.nodes.some((n) => n.name === "onlyOne")).toBe(true);
    expect(snap.graph.nodes.some((n) => n.name === "alpha")).toBe(false);
  });

  it("finds nodes by fingerprint", () => {
    const single = extractGraphFromSource(fileB);
    const node = single.nodes.find((n) => n.kind === "class");
    expect(node).toBeDefined();

    const { store } = mergeFileIntoStore(createGraphStore(), fileB);
    const found = findNodeByFingerprint(store, node!.fingerprint);
    expect(found?.id).toBe(node!.id);
    expect(found?.name).toBe("Widget");
  });

  it("removes all nodes and edges for a deleted uri", () => {
    let store = mergeFileIntoStore(createGraphStore(), fileA).store;
    const before = toGraphStoreSnapshot(store).graph.nodes.length;
    const { store: next, delta } = removeUriFromStore(store, fileA.uri);
    expect(delta.removeNodeIds?.length).toBe(before);
    expect(toGraphStoreSnapshot(next).graph.nodes).toHaveLength(0);
    expect(getUriIndexEntry(next, fileA.uri)).toBeUndefined();
  });
});
