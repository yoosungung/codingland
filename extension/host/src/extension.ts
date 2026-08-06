import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { CanvasEditorProvider } from "./canvasEditorProvider";
import { getPanel, showPanel } from "./panel";
import { revealBeside } from "./revealBeside";

export function activate(context: vscode.ExtensionContext): void {
  const panel = getPanel();
  panel.appendLine("[codingland] host activate (M0 stub)");

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      new SidebarProvider(context.extensionUri)
    ),
    CanvasEditorProvider.register(context),
    vscode.commands.registerCommand("codingland.showPanel", () => {
      showPanel();
    }),
    vscode.commands.registerCommand(
      "codingland.revealBeside",
      async (uri?: vscode.Uri) => {
        await revealBeside(uri);
      }
    ),
    vscode.commands.registerCommand("codingland.openCanvas", async () => {
      const doc = await vscode.workspace.openTextDocument({
        language: "json",
        content: JSON.stringify(
          { kind: "codingland.canvas", version: 0, stub: true },
          null,
          2
        ),
      });
      // Untitled docs won't match *.codingland.json — write a temp workspace file if possible
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (folder) {
        const target = vscode.Uri.joinPath(folder.uri, ".codingland-canvas.codingland.json");
        await vscode.workspace.fs.writeFile(
          target,
          Buffer.from(
            JSON.stringify(
              { kind: "codingland.canvas", version: 0, stub: true },
              null,
              2
            ),
            "utf8"
          )
        );
        await vscode.commands.executeCommand(
          "vscode.openWith",
          target,
          CanvasEditorProvider.viewType
        );
      } else {
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(
          "Codingland: open a workspace folder to use the Canvas custom editor stub."
        );
      }
    }),
    panel
  );
}

export function deactivate(): void {
  // no-op
}
