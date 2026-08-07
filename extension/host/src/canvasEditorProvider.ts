import * as vscode from "vscode";
import {
  ProtocolEvents,
  PAYMENT_MIDDLEWARE_FILE,
  PAYMENT_MIDDLEWARE_SOURCE,
  IsolatedRunner,
  applySemanticZoom,
  extractGraphFromSource,
  type GraphNode,
  type GraphSnapshot,
  type RuntimeSnapshot,
  type ZoomLevel,
} from "@codingland/core";
import { revealBeside } from "./revealBeside";
import { getPanel } from "./panel";

/** Custom Editor (Canvas) — graph + zoom + Time Bar / Hot Reboot (M2). */
export class CanvasEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "codingland.canvas";

  private static panel: vscode.WebviewPanel | undefined;
  private static fullSnapshot: GraphSnapshot | undefined;
  private static runner: IsolatedRunner | undefined;
  private static timeline: RuntimeSnapshot[] = [];

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
        const result = CanvasEditorProvider.ensureRunner().hotReboot();
        CanvasEditorProvider.timeline = result.snapshots;
        await CanvasEditorProvider.pushTimeline();
        void vscode.window.showInformationMessage(
          result.ok
            ? `Codingland: Hot Reboot → ${result.checkpointId}`
            : "Codingland: Hot Reboot failed (no checkpoint)"
        );
        return;
      }
      if (msg?.type === ProtocolEvents.TIMELINE_ON_CHANGE_END) {
        const snapshotId = msg.payload?.snapshotId as string | undefined;
        if (snapshotId) {
          getPanel().appendLine(
            `[codingland] timeline.onChangeEnd ${snapshotId}`
          );
        }
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

    CanvasEditorProvider.ensureRunner();
    await CanvasEditorProvider.pushTimeline();

    if (CanvasEditorProvider.fullSnapshot) {
      await CanvasEditorProvider.pushDelta();
    }

    void document;
  }

  private static ensureRunner(): IsolatedRunner {
    if (!CanvasEditorProvider.runner) {
      const runner = new IsolatedRunner({
        mockIo: {
          http: (req) => ({ status: 200, body: req }),
        },
      });
      runner.recordCall("fp-charge", { amount: 10 }, "call");
      runner.recordCall("fp-auth", { token: "live-token" }, "call");
      runner.recordCall("fp-exception", { err: "boom" }, "exception");
      runner.checkpoint("cp-before-exception");
      CanvasEditorProvider.runner = runner;
      CanvasEditorProvider.timeline = runner.snapshots();
    }
    return CanvasEditorProvider.runner;
  }

  private static async pushTimeline(): Promise<void> {
    if (!CanvasEditorProvider.panel) {
      return;
    }
    await CanvasEditorProvider.panel.webview.postMessage({
      type: ProtocolEvents.TIMELINE_CACHE,
      payload: CanvasEditorProvider.timeline,
    });
  }

  private getHtml(): string {
    const hotReboot = ProtocolEvents.RUNNER_HOT_REBOOT;
    const select = ProtocolEvents.GRAPH_SELECT;
    const delta = ProtocolEvents.GRAPH_DELTA;
    const timelineCache = ProtocolEvents.TIMELINE_CACHE;
    const timelineEnd = ProtocolEvents.TIMELINE_ON_CHANGE_END;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    body { margin: 0; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; height: 100vh; }
    #time-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
    #time-bar input[type=range] { flex: 1; }
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
    <span>Time Bar</span>
    <input id="scrub" type="range" min="0" max="0" value="0" aria-label="Timeline scrub" />
    <span id="scrub-label"></span>
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
    let timeline = [];
    const scrub = document.getElementById('scrub');
    const scrubLabel = document.getElementById('scrub-label');
    function applyScrub() {
      const idx = Number(scrub.value) || 0;
      const snap = timeline[idx];
      scrubLabel.textContent = snap ? (snap.marker + ' @' + snap.tMs) : '';
      if (snap) {
        vscode.postMessage({ type: '${timelineEnd}', payload: { snapshotId: snap.id } });
      }
    }
    scrub.addEventListener('change', applyScrub);
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
      if (!msg) return;
      if (msg.type === '${timelineCache}') {
        timeline = Array.isArray(msg.payload) ? msg.payload : [];
        scrub.max = Math.max(0, timeline.length - 1);
        scrub.value = scrub.max;
        applyScrub();
        return;
      }
      if (msg.type !== '${delta}') return;
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
