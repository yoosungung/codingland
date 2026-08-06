import * as vscode from "vscode";
import {
  ProtocolEvents,
  PAYMENT_MIDDLEWARE_FILE,
  PAYMENT_MIDDLEWARE_SOURCE,
  applySemanticZoom,
  extractGraphFromSource,
  type GraphNode,
  type GraphSnapshot,
  type ZoomLevel,
} from "@codingland/core";
import { revealBeside } from "./revealBeside";

/** Custom Editor (Canvas) — M1 boundary graph + Semantic Zoom + Beside. */
export class CanvasEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "codingland.canvas";

  private static panel: vscode.WebviewPanel | undefined;
  private static fullSnapshot: GraphSnapshot | undefined;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      CanvasEditorProvider.viewType,
      new CanvasEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  /** Load payment-middleware sample into the open Canvas. */
  public static async loadPaymentSample(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    let uri: string;
    if (folder) {
      const target = vscode.Uri.joinPath(
        folder.uri,
        ".codingland-sample",
        PAYMENT_MIDDLEWARE_FILE
      );
      await vscode.workspace.fs.writeFile(
        target,
        Buffer.from(PAYMENT_MIDDLEWARE_SOURCE, "utf8")
      );
      uri = target.toString();
    } else {
      uri = `untitled:${PAYMENT_MIDDLEWARE_FILE}`;
    }
    const snap = extractGraphFromSource({
      source: PAYMENT_MIDDLEWARE_SOURCE,
      uri,
      fileName: PAYMENT_MIDDLEWARE_FILE,
    });
    CanvasEditorProvider.fullSnapshot = snap;
    await CanvasEditorProvider.pushDelta(snap.zoomLevel);
    void context;
    void vscode.window.showInformationMessage(
      "Codingland: payment middleware sample loaded"
    );
  }

  public static async pushDelta(zoomLevel?: ZoomLevel): Promise<void> {
    const full = CanvasEditorProvider.fullSnapshot;
    if (!full || !CanvasEditorProvider.panel) {
      return;
    }
    const level = zoomLevel ?? full.zoomLevel;
    const view = applySemanticZoom(full, level);
    CanvasEditorProvider.fullSnapshot = { ...full, zoomLevel: level };
    await CanvasEditorProvider.panel.webview.postMessage({
      type: ProtocolEvents.GRAPH_DELTA,
      payload: {
        upsertNodes: view.nodes,
        upsertEdges: view.edges,
        removeNodeIds: [],
        removeEdgeIds: [],
        zoomLevel: view.zoomLevel,
      },
    });
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    CanvasEditorProvider.panel = webviewPanel;
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    webviewPanel.webview.html = this.getHtml();

    webviewPanel.onDidDispose(() => {
      if (CanvasEditorProvider.panel === webviewPanel) {
        CanvasEditorProvider.panel = undefined;
      }
    });

    webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === ProtocolEvents.RUNNER_HOT_REBOOT) {
        void vscode.window.showInformationMessage(
          "Codingland: Hot Reboot stub (no-op until M2)"
        );
        return;
      }
      if (msg?.type === ProtocolEvents.GRAPH_SELECT) {
        const node = msg.payload as GraphNode | undefined;
        if (node?.uri) {
          await revealBeside({ uri: node.uri, range: node.range });
        }
        return;
      }
      if (msg?.type === "canvas.zoom") {
        const level = msg.payload?.zoomLevel as ZoomLevel | undefined;
        if (level) {
          await CanvasEditorProvider.pushDelta(level);
        }
      }
    });

    if (CanvasEditorProvider.fullSnapshot) {
      await CanvasEditorProvider.pushDelta();
    }

    void document;
  }

  private getHtml(): string {
    const hotReboot = ProtocolEvents.RUNNER_HOT_REBOOT;
    const select = ProtocolEvents.GRAPH_SELECT;
    const delta = ProtocolEvents.GRAPH_DELTA;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    body { margin: 0; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; height: 100vh; }
    #time-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
    #zoom { display: flex; gap: 6px; padding: 6px 12px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
    #canvas { flex: 1; position: relative; overflow: auto; }
    .node { position: absolute; min-width: 100px; padding: 8px 10px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-editorWidget-background); cursor: pointer; font-size: 12px; }
    .node:hover { outline: 1px solid var(--vscode-focusBorder); }
    .kind { opacity: 0.7; font-size: 10px; }
    button { cursor: pointer; }
  </style>
</head>
<body>
  <div id="time-bar" role="toolbar" aria-label="Time Bar">
    <span>Time Bar (stub)</span>
    <input type="range" min="0" max="100" value="0" aria-label="Timeline scrub" />
    <button id="hot-reboot" type="button">Hot Reboot</button>
  </div>
  <div id="zoom" role="toolbar" aria-label="Semantic Zoom">
    <span>Zoom:</span>
    <button type="button" data-zoom="boundary">boundary</button>
    <button type="button" data-zoom="function">function</button>
    <button type="button" data-zoom="detail">detail</button>
    <span id="zoom-label"></span>
  </div>
  <div id="canvas" aria-label="Knowledge graph"></div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('hot-reboot').addEventListener('click', () => {
      vscode.postMessage({ type: '${hotReboot}', payload: {} });
    });
    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        vscode.postMessage({ type: 'canvas.zoom', payload: { zoomLevel: btn.getAttribute('data-zoom') } });
      });
    });
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || msg.type !== '${delta}') return;
      const payload = msg.payload || {};
      const canvas = document.getElementById('canvas');
      canvas.innerHTML = '';
      (payload.upsertNodes || []).forEach((n) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'node';
        el.style.left = ((n.anchor && n.anchor.x) || 0) + 'px';
        el.style.top = ((n.anchor && n.anchor.y) || 0) + 'px';
        el.innerHTML = '<div class="kind">' + n.kind + '</div><div>' + n.name + '</div>';
        el.addEventListener('click', () => {
          vscode.postMessage({ type: '${select}', payload: n });
        });
        canvas.appendChild(el);
      });
      document.getElementById('zoom-label').textContent = payload.zoomLevel || '';
    });
  </script>
</body>
</html>`;
  }
}
