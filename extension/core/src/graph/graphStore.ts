import { applyGraphDelta } from "./delta";
import type { GraphDelta, GraphEdge, GraphNode, GraphSnapshot } from "./types";
import { extractGraphFromSource, type ExtractInput } from "../ast/extract";

export interface GraphStoreSnapshot {
  graph: GraphSnapshot;
  /** uri → node/edge ids from that file (for incremental removal) */
  uriIndex: Record<string, { nodeIds: string[]; edgeIds: string[] }>;
}

export interface GraphStoreState {
  graph: GraphSnapshot;
  uriIndex: Record<string, { nodeIds: string[]; edgeIds: string[] }>;
  fingerprintIndex: Map<string, GraphNode>;
}

export interface MergeResult {
  store: GraphStoreState;
  delta: GraphDelta;
}

export function createGraphStore(): GraphStoreState {
  return {
    graph: { nodes: [], edges: [], zoomLevel: "boundary" },
    uriIndex: {},
    fingerprintIndex: new Map(),
  };
}

export function toGraphStoreSnapshot(store: GraphStoreState): GraphStoreSnapshot {
  return {
    graph: store.graph,
    uriIndex: { ...store.uriIndex },
  };
}

export function getUriIndexEntry(
  store: GraphStoreState,
  uri: string
): { nodeIds: string[]; edgeIds: string[] } | undefined {
  return store.uriIndex[uri];
}

export function findNodeByFingerprint(
  store: GraphStoreState,
  fingerprint: string
): GraphNode | undefined {
  return store.fingerprintIndex.get(fingerprint);
}

export function mergeFileIntoStore(
  store: GraphStoreState,
  input: ExtractInput
): MergeResult {
  const extracted = extractGraphFromSource(input);
  const prior = store.uriIndex[input.uri];
  const delta: GraphDelta = {
    removeNodeIds: prior?.nodeIds ?? [],
    removeEdgeIds: prior?.edgeIds ?? [],
    upsertNodes: extracted.nodes,
    upsertEdges: extracted.edges,
    zoomLevel: store.graph.zoomLevel,
  };

  const graph = applyGraphDelta(store.graph, delta);
  const uriIndex = {
    ...store.uriIndex,
    [input.uri]: {
      nodeIds: extracted.nodes.map((n) => n.id),
      edgeIds: extracted.edges.map((e) => e.id),
    },
  };

  const fingerprintIndex = rebuildFingerprintIndex(
    store.fingerprintIndex,
    prior?.nodeIds ?? [],
    extracted.nodes
  );

  return {
    store: { graph, uriIndex, fingerprintIndex },
    delta,
  };
}

export function mergeFilesIntoStore(
  store: GraphStoreState,
  inputs: ExtractInput[]
): MergeResult {
  let current = store;
  const combined: GraphDelta = {
    removeNodeIds: [],
    removeEdgeIds: [],
    upsertNodes: [],
    upsertEdges: [],
  };

  for (const input of inputs) {
    const { store: next, delta } = mergeFileIntoStore(current, input);
    current = next;
    combined.removeNodeIds!.push(...(delta.removeNodeIds ?? []));
    combined.removeEdgeIds!.push(...(delta.removeEdgeIds ?? []));
    combined.upsertNodes!.push(...(delta.upsertNodes ?? []));
    combined.upsertEdges!.push(...(delta.upsertEdges ?? []));
  }

  combined.zoomLevel = current.graph.zoomLevel;
  return { store: current, delta: combined };
}

export function removeUriFromStore(
  store: GraphStoreState,
  uri: string
): MergeResult {
  const prior = store.uriIndex[uri];
  if (!prior) {
    return { store, delta: {} };
  }
  const delta: GraphDelta = {
    removeNodeIds: prior.nodeIds,
    removeEdgeIds: prior.edgeIds,
    zoomLevel: store.graph.zoomLevel,
  };
  const graph = applyGraphDelta(store.graph, delta);
  const uriIndex = { ...store.uriIndex };
  delete uriIndex[uri];
  const fingerprintIndex = rebuildFingerprintIndex(
    store.fingerprintIndex,
    prior.nodeIds,
    []
  );
  return {
    store: { graph, uriIndex, fingerprintIndex },
    delta,
  };
}

function rebuildFingerprintIndex(
  prior: Map<string, GraphNode>,
  removedNodeIds: string[],
  upserted: GraphNode[]
): Map<string, GraphNode> {
  const next = new Map(prior);
  for (const id of removedNodeIds) {
    for (const [fp, node] of next) {
      if (node.id === id) {
        next.delete(fp);
      }
    }
  }
  for (const node of upserted) {
    next.set(node.fingerprint, node);
  }
  return next;
}
