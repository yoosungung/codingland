import * as vscode from "vscode";

/**
 * Reveal source Beside the Canvas (ARCHITECTURE §1.12).
 * M0: opens active/arg URI in ViewColumn.Beside.
 */
export async function revealBeside(uri?: vscode.Uri): Promise<void> {
  const target =
    uri ??
    vscode.window.activeTextEditor?.document.uri ??
    (await pickOpenableUri());

  if (!target) {
    void vscode.window.showWarningMessage(
      "Codingland: no document to reveal beside"
    );
    return;
  }

  const doc = await vscode.workspace.openTextDocument(target);
  await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: true,
    preserveFocus: false,
  });
}

async function pickOpenableUri(): Promise<vscode.Uri | undefined> {
  const editors = vscode.window.visibleTextEditors;
  return editors[0]?.document.uri;
}
