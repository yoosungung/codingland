import * as vscode from "vscode";

let channel: vscode.OutputChannel | undefined;

/** Native Panel stub — OutputChannel for Mirror/Bypass/CLI logs (ARCHITECTURE §2). */
export function getPanel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel("Codingland");
  }
  return channel;
}

export function showPanel(): void {
  const c = getPanel();
  c.appendLine("[codingland] panel stub ready");
  c.show(true);
}
