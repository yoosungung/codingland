import * as vscode from "vscode";
import {
  ProtocolEvents,
  PAYMENT_MIDDLEWARE_FILE,
  PAYMENT_MIDDLEWARE_SOURCE,
  extractGraphFromSource,
  type GraphDelta,
  type GraphNode,
  type GraphSnapshot,
  type ZoomLevel,
} from "@codingland/core";
import { revealBeside } from "./revealBeside";
import { getPanel } from "./panel";
import { buildCanvasViewDelta } from "./canvasViewDelta";
import { RunnerTape } from "./runnerTape";
import { mergeWorkspaceDelta } from "./workspaceGraphMerge";

export { MAX_CANVAS_NODES } from "./canvasViewDelta";

/** Canvas graph + panel + webview routing (demo runner tape lives in RunnerTape). */
export class CanvasSession {
  private panel: vscode.WebviewPanel | undefined;
  private fullSnapshot: GraphSnapshot | undefined;
  private readonly tape = new RunnerTape();

  hasPanel(): boolean {
    return this.panel !== undefined;
  }

  revealPanel(): void {
    this.panel?.reveal(vscode.ViewColumn.Beside, false);
  }

  attachPanel(panel: vscode.WebviewPanel): void {
    this.panel = panel;
  }

  detachPanel(panel: vscode.WebviewPanel): void {
    if (this.panel === panel) {
      this.panel = undefined;
    }
  }

  /** Load payment-middleware sample graph (caller opens Canvas if needed). */
  async preparePaymentSample(context: vscode.ExtensionContext): Promise<void> {
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
    this.fullSnapshot = snap;
    void context;
    void vscode.window.showInformationMessage(
      "Codingland: payment middleware sample loaded"
    );
  }

  async pushDelta(zoomLevel?: ZoomLevel): Promise<void> {
    const full = this.fullSnapshot;
    if (!full || !this.panel) {
      return;
    }
    const level = zoomLevel ?? full.zoomLevel;
    this.fullSnapshot = { ...full, zoomLevel: level };
    await this.panel.webview.postMessage({
      type: ProtocolEvents.GRAPH_DELTA,
      payload: buildCanvasViewDelta(this.fullSnapshot, level),
    });
  }

  /** Replace Canvas graph from Workspace Ingest full scan (M4). */
  async setWorkspaceGraph(snapshot: GraphSnapshot): Promise<void> {
    this.fullSnapshot = {
      ...snapshot,
      zoomLevel: snapshot.zoomLevel ?? "boundary",
    };
    await this.pushDelta();
  }

  /** Apply incremental ingest delta to Canvas (M4 onDidSave / watcher). */
  async applyWorkspaceDelta(delta: GraphDelta): Promise<void> {
    this.fullSnapshot = mergeWorkspaceDelta(this.fullSnapshot, delta);
    // Same zoom+cap+truncated path as full push (DOM view tracks capped snapshot).
    await this.pushDelta();
  }

  async pushTimeline(): Promise<void> {
    if (!this.panel) {
      return;
    }
    await this.panel.webview.postMessage({
      type: ProtocolEvents.TIMELINE_CACHE,
      payload: this.tape.snapshots(),
    });
  }

  async onPanelReady(): Promise<void> {
    this.tape.ensureRunner();
    await this.pushTimeline();
    if (this.fullSnapshot) {
      await this.pushDelta();
    }
  }

  async handleWebviewMessage(msg: unknown): Promise<void> {
    if (!msg || typeof msg !== "object") {
      return;
    }
    const typed = msg as { type?: string; payload?: unknown };
    if (typed.type === ProtocolEvents.RUNNER_HOT_REBOOT) {
      const result = this.tape.hotReboot();
      await this.pushTimeline();
      void vscode.window.showInformationMessage(
        result.ok
          ? `Codingland: Hot Reboot → ${result.checkpointId}`
          : "Codingland: Hot Reboot failed (no checkpoint)"
      );
      return;
    }
    if (typed.type === ProtocolEvents.TIMELINE_ON_CHANGE_END) {
      const payload = typed.payload as { snapshotId?: string } | undefined;
      const snapshotId = payload?.snapshotId;
      if (snapshotId) {
        getPanel().appendLine(
          `[codingland] timeline.onChangeEnd ${snapshotId}`
        );
      }
      return;
    }
    if (typed.type === ProtocolEvents.GRAPH_SELECT) {
      const node = typed.payload as GraphNode | undefined;
      if (node?.uri) {
        await revealBeside({ uri: node.uri, range: node.range });
      }
      return;
    }
    if (typed.type === "canvas.zoom") {
      const payload = typed.payload as { zoomLevel?: ZoomLevel } | undefined;
      const level = payload?.zoomLevel;
      if (level) {
        await this.pushDelta(level);
      }
    }
  }
}
