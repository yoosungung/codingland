import { Project, SyntaxKind, type Node, type SourceFile } from "ts-morph";
import { fingerprintAst } from "../graph/fingerprint";
import { ensureAnchors } from "../graph/layout";
import type {
  GraphEdge,
  GraphNode,
  GraphSnapshot,
  NodeKind,
} from "../graph/types";

export interface ExtractInput {
  source: string;
  uri: string;
  fileName: string;
}

function rangeOf(node: Node): GraphNode["range"] {
  const start = node.getStartLineNumber();
  const end = node.getEndLineNumber();
  return {
    startLine: start,
    startCol: 0,
    endLine: end,
    endCol: 0,
  };
}

function makeNode(
  kind: NodeKind,
  name: string,
  uri: string,
  node: Node,
  parentId?: string
): GraphNode {
  const range = rangeOf(node);
  const id = `${kind}:${name}:${range.startLine}`;
  return {
    id,
    fingerprint: fingerprintAst({ kind, name, uri, range }),
    kind,
    name,
    uri,
    range,
    verifyState: "unverified",
    confidence: "extracted",
    parentId,
  };
}

function makeEdge(
  from: string,
  to: string,
  kind: GraphEdge["kind"]
): GraphEdge {
  return {
    id: `${kind}:${from}->${to}`,
    from,
    to,
    kind,
    confidence: "extracted",
  };
}

/**
 * Extract Module/Class/Function KG from a single TS source string (M1).
 * Edges are `extracted` only — no inferred edges in this path.
 */
export function extractGraphFromSource(input: ExtractInput): GraphSnapshot {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
      target: 99, // ESNext
    },
  });
  const sf = project.createSourceFile(input.fileName, input.source);
  return graphFromSourceFile(sf, input.uri);
}

function graphFromSourceFile(sf: SourceFile, uri: string): GraphSnapshot {
  const moduleName = sf.getBaseName().replace(/\.[^.]+$/, "");
  const moduleNode = makeNode("module", moduleName, uri, sf);
  const nodes: GraphNode[] = [moduleNode];
  const edges: GraphEdge[] = [];
  const byName = new Map<string, GraphNode>();
  byName.set(moduleName, moduleNode);

  for (const cls of sf.getClasses()) {
    const name = cls.getName() ?? "AnonymousClass";
    const classNode = makeNode("class", name, uri, cls, moduleNode.id);
    nodes.push(classNode);
    edges.push(makeEdge(moduleNode.id, classNode.id, "contains"));
    byName.set(name, classNode);

    for (const method of cls.getMethods()) {
      const mName = method.getName();
      const fnNode = makeNode("function", mName, uri, method, classNode.id);
      nodes.push(fnNode);
      edges.push(makeEdge(classNode.id, fnNode.id, "contains"));
      byName.set(`${name}.${mName}`, fnNode);
      byName.set(mName, fnNode);
    }
  }

  for (const fn of sf.getFunctions()) {
    const name = fn.getName() ?? "anonymous";
    const fnNode = makeNode("function", name, uri, fn, moduleNode.id);
    nodes.push(fnNode);
    edges.push(makeEdge(moduleNode.id, fnNode.id, "contains"));
    byName.set(name, fnNode);
  }

  // Simple same-file call edges: CallExpression → callee name match
  for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression();
    let calleeName: string | undefined;
    if (expr.getKind() === SyntaxKind.Identifier) {
      calleeName = expr.getText();
    } else if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      calleeName = expr.getLastChildByKind(SyntaxKind.Identifier)?.getText();
    }
    if (!calleeName) {
      continue;
    }
    const to = byName.get(calleeName);
    if (!to) {
      continue;
    }
    const enclosing =
      call.getFirstAncestorByKind(SyntaxKind.MethodDeclaration) ??
      call.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
    if (!enclosing) {
      continue;
    }
    const fromName =
      enclosing.getKind() === SyntaxKind.MethodDeclaration
        ? enclosing.getFirstChildByKind(SyntaxKind.Identifier)?.getText()
        : enclosing.getFirstChildByKind(SyntaxKind.Identifier)?.getText();
    // Prefer method full key if parent class known
    let from = fromName ? byName.get(fromName) : undefined;
    if (enclosing.getKind() === SyntaxKind.MethodDeclaration) {
      const parentClass = enclosing.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration
      );
      const className = parentClass?.getName();
      if (className && fromName) {
        from = byName.get(`${className}.${fromName}`) ?? from;
      }
    }
    if (!from || from.id === to.id) {
      continue;
    }
    const edge = makeEdge(from.id, to.id, "calls");
    if (!edges.some((e) => e.id === edge.id)) {
      edges.push(edge);
    }
  }

  const withAnchors = ensureAnchors(nodes);
  return {
    nodes: withAnchors,
    edges,
    zoomLevel: "boundary",
  };
}
