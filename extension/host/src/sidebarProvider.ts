import * as vscode from "vscode";

/** Native Sidebar stub — Agent / Debt Meter placeholder (ARCHITECTURE §2). */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codingland.sidebar";

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webviewView.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
  <style>
    body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); }
    h1 { font-size: 14px; margin: 0 0 8px; }
    p { opacity: 0.8; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Codingland</h1>
  <p>Sidebar stub (M0) — Agent / Debt Meter placeholder.</p>
</body>
</html>`;
  }
}
