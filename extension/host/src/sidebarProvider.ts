import * as vscode from "vscode";
import type { GateSmokeResult } from "@codingland/core";

/** Native Sidebar — Agent / Debt / Mirror Gate (ARCHITECTURE §2, §5). */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codingland.sidebar";

  private view?: vscode.WebviewView;
  private lastGateHtml = "<p>No gate session yet.</p>";

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    this.refreshHtml();
    webviewView.webview.onDidReceiveMessage((msg: { type?: string }) => {
      if (msg?.type === "gate.accept" || msg?.type === "gate.reject") {
        void vscode.window.showInformationMessage(
          `Codingland Gate: ${msg.type} (use codingland.triggerGate for smoke)`
        );
      }
    });
  }

  postGate(envelope: { type: string; payload: unknown }): void {
    void this.view?.webview.postMessage(envelope);
  }

  renderGateResult(result: GateSmokeResult): void {
    const bypass = result.session.score.bypassAllowed ? "yes" : "no";
    this.lastGateHtml = `
      <h2>Mirror Gate</h2>
      <p>tier: <b>${result.scoreTier}</b></p>
      <p>phase: <b>${result.session.phase}</b></p>
      <p>passed: <b>${result.passed}</b></p>
      <p>bypassAllowed: ${bypass}</p>
      <p>sessionLoad: ${result.session.score.sessionLoad}</p>
      <pre style="white-space:pre-wrap;font-size:11px;opacity:0.85;">${escapeHtml(
        (result.draftMarkdown ?? "").slice(0, 800)
      )}</pre>
      <button id="accept">Confirm Consensus</button>
      <button id="reject">Reject</button>
    `;
    this.refreshHtml();
  }

  private refreshHtml(): void {
    if (!this.view) {
      return;
    }
    this.view.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); }
    h1 { font-size: 14px; margin: 0 0 8px; }
    h2 { font-size: 13px; margin: 12px 0 6px; }
    p { opacity: 0.9; font-size: 12px; margin: 4px 0; }
    button { margin: 4px 4px 0 0; }
  </style>
</head>
<body>
  <h1>Codingland</h1>
  <p>Agent / Debt / Gate</p>
  <div id="gate">${this.lastGateHtml}</div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('gate')?.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.id === 'accept') vscode.postMessage({ type: 'gate.accept' });
      if (t && t.id === 'reject') vscode.postMessage({ type: 'gate.reject' });
    });
  </script>
</body>
</html>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
