import * as vscode from "vscode";

export interface RevealBesidePayload {
  uri: string;
  range?: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
}

/**
 * Reveal source Beside the Canvas (ARCHITECTURE §1.12).
 * Accepts URI string payload from `editor.revealBeside` or a vscode.Uri.
 */
export async function revealBeside(
  target?: RevealBesidePayload | vscode.Uri | string
): Promise<void> {
  const resolved = await resolveTarget(target);
  if (!resolved) {
    void vscode.window.showWarningMessage(
      "Codingland: no document to reveal beside"
    );
    return;
  }

  const doc = await vscode.workspace.openTextDocument(resolved.uri);
  const editor = await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: true,
    preserveFocus: false,
  });

  if (resolved.range) {
    const start = new vscode.Position(
      Math.max(0, resolved.range.startLine - 1),
      Math.max(0, resolved.range.startCol)
    );
    const end = new vscode.Position(
      Math.max(0, resolved.range.endLine - 1),
      Math.max(0, resolved.range.endCol)
    );
    editor.selection = new vscode.Selection(start, end);
    editor.revealRange(
      new vscode.Range(start, end),
      vscode.TextEditorRevealType.InCenter
    );
  }
}

async function resolveTarget(
  target?: RevealBesidePayload | vscode.Uri | string
): Promise<{ uri: vscode.Uri; range?: RevealBesidePayload["range"] } | undefined> {
  if (!target) {
    const active = vscode.window.activeTextEditor?.document.uri;
    if (active) {
      return { uri: active };
    }
    return vscode.window.visibleTextEditors[0]
      ? { uri: vscode.window.visibleTextEditors[0].document.uri }
      : undefined;
  }

  if (typeof target === "string") {
    return { uri: vscode.Uri.parse(target) };
  }

  if (target instanceof vscode.Uri) {
    return { uri: target };
  }

  return {
    uri: vscode.Uri.parse(target.uri),
    range: target.range,
  };
}
