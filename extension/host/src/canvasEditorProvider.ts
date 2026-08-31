import * as vscode from "vscode";
import type { GraphDelta, GraphSnapshot } from "@codingland/core";
import { buildCanvasHtml } from "./canvasHtml";
import { CanvasSession } from "./canvasSession";
import { getPanel } from "./panel";

/** Custom Editor + command WebviewPanel Canvas — thin VS Code adapter over CanvasSession. */
export class CanvasEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "codingland.canvas";

  private static session: CanvasSession | undefined;

  public static register(
    context: vscode.ExtensionContext,
    session: CanvasSession
  ): vscode.Disposable {
    CanvasEditorProvider.session = session;
    return vscode.window.registerCustomEditorProvider(
      CanvasEditorProvider.viewType,
      new CanvasEditorProvider(context, session),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  /**
   * Open Canvas via WebviewPanel (not CustomTextEditor).
   * Avoids stuck editor progress when custom-editor resolve is delayed/orphaned.
   */
  public static async openCanvas(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const session = CanvasEditorProvider.requireSession();
    if (session.hasPanel()) {
      session.revealPanel();
      await session.onPanelReady();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      CanvasEditorProvider.viewType,
      "Codingland Canvas",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );
    const provider = new CanvasEditorProvider(context, session);
    await provider.bindPanel(panel);
  }

  /** Load payment-middleware sample into the open Canvas. */
  public static async loadPaymentSample(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const session = CanvasEditorProvider.requireSession();
    await session.preparePaymentSample(context);
    await CanvasEditorProvider.openCanvas(context);
    await session.pushDelta();
  }

  public static async pushDelta(
    zoomLevel?: import("@codingland/core").ZoomLevel
  ): Promise<void> {
    await CanvasEditorProvider.requireSession().pushDelta(zoomLevel);
  }

  /** Replace Canvas graph from Workspace Ingest full scan (M4). */
  public static async setWorkspaceGraph(snapshot: GraphSnapshot): Promise<void> {
    await CanvasEditorProvider.requireSession().setWorkspaceGraph(snapshot);
  }

  /** Apply incremental ingest delta to Canvas (M4 onDidSave / watcher). */
  public static async applyWorkspaceDelta(delta: GraphDelta): Promise<void> {
    await CanvasEditorProvider.requireSession().applyWorkspaceDelta(delta);
  }

  private static requireSession(): CanvasSession {
    if (!CanvasEditorProvider.session) {
      throw new Error("CanvasEditorProvider.register was not called");
    }
    return CanvasEditorProvider.session;
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly session: CanvasSession
  ) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    try {
      await this.bindPanel(webviewPanel);
    } catch (err) {
      getPanel().appendLine(
        `[codingland] canvas resolve failed: ${String(err)}`
      );
      webviewPanel.webview.html = `<!DOCTYPE html><html><body style="font-family:var(--vscode-font-family);padding:16px">
        <p>Codingland Canvas failed to load.</p>
        <pre>${String(err).replace(/[<>&]/g, "")}</pre>
      </body></html>`;
    }
    void document;
  }

  private async bindPanel(webviewPanel: vscode.WebviewPanel): Promise<void> {
    this.session.attachPanel(webviewPanel);
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    // Set HTML first so the editor never stays on an endless progress bar.
    webviewPanel.webview.html = buildCanvasHtml();

    webviewPanel.onDidDispose(() => {
      this.session.detachPanel(webviewPanel);
    });

    webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      await this.session.handleWebviewMessage(msg);
    });

    await this.session.onPanelReady();
  }
}
