/** ARCHITECTURE §4.1 Graph — types only (no vscode). */

export type NodeKind = "module" | "class" | "function" | "object";
export type VerifyState = "unverified" | "verified" | "bypassed";
export type ZoomLevel = "boundary" | "function" | "detail";
export type EdgeConfidence = "extracted" | "inferred";

export interface GraphNode {
  id: string;
  fingerprint: string;
  kind: NodeKind;
  name: string;
  uri: string;
  range: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
  verifyState: VerifyState;
  confidence?: EdgeConfidence;
  parentId?: string;
  anchor?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: "depends" | "calls" | "contains" | "references";
  confidence?: EdgeConfidence;
}

export interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  zoomLevel: ZoomLevel;
}

export interface GraphDelta {
  upsertNodes?: GraphNode[];
  removeNodeIds?: string[];
  upsertEdges?: GraphEdge[];
  removeEdgeIds?: string[];
  zoomLevel?: ZoomLevel;
}

export interface GraphPathQuery {
  fromFingerprint: string;
  toFingerprint: string;
}

export interface GraphPathResult {
  nodeIds: string[];
  edgeIds: string[];
  confidence: EdgeConfidence;
}
