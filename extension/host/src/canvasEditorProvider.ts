import * as vscode from "vscode";
import { ProtocolEvents } from "@codingland/core";

/** Custom Editor (Canvas) stub with Time Bar + Hot Reboot placeholders. */
export class CanvasEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "codingland.canvas";

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      CanvasEditorProvider.viewType,
      new CanvasEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    webviewPanel.webview.html = this.getHtml();

    webviewPanel.webview.onDidReceiveMessage((msg) => {
      if (msg?.type === ProtocolEvents.RUNNER_HOT_REBOOT) {
        void vscode.window.showInformationMessage(
          "Codingland: Hot Reboot stub (no-op in M0)"
        );
      }
    });

    void document;
  }

  private getHtml(): string {
    const hotReboot = ProtocolEvents.RUNNER_HOT_REBOOT;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    body { margin: 0; font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; height: 100vh; }
    #time-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--vscode-panel-border); font-size: 12px; }
    #time-bar input[type=range] { flex: 1; }
    #canvas { flex: 1; display: flex; align-items: center; justify-content: center; opacity: 0.7; font-size: 13px; }
    button { cursor: pointer; }
  </style>
</head>
<body>
  <div id="time-bar" role="toolbar" aria-label="Time Bar">
    <span>Time Bar (stub)</span>
    <input type="range" min="0" max="100" value="0" aria-label="Timeline scrub" />
    <button id="hot-reboot" type="button">Hot Reboot</button>
  </div>
  <div id="canvas">Canvas stub (M0) — microworld arrives in M1</div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('hot-reboot').addEventListener('click', () => {
      vscode.postMessage({ type: '${hotReboot}', payload: {} });
    });
  </script>
</body>
</html>`;
  }
}
