import * as vscode from "vscode";
import type { GraphDelta, GraphSnapshot } from "@codingland/core";
import { buildCanvasHtml } from "./canvasHtml";
import { CanvasSession } from "./canvasSession";

/** Custom Editor (Canvas) — thin VS Code adapter over CanvasSession. */
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

  /** Load payment-middleware sample into the open Canvas. */
  public static async loadPaymentSample(
    context: vscode.ExtensionContext
  ): Promise<void> {
    await CanvasEditorProvider.requireSession().loadPaymentSample(context);
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
    this.session.attachPanel(webviewPanel);
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    webviewPanel.webview.html = buildCanvasHtml();

    webviewPanel.onDidDispose(() => {
      this.session.detachPanel(webviewPanel);
    });

    webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      await this.session.handleWebviewMessage(msg);
    });

    await this.session.onPanelReady();

    void document;
  }
}
