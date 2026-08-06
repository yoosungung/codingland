import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { CanvasEditorProvider } from "./canvasEditorProvider";
import { getPanel, showPanel } from "./panel";
import { revealBeside, type RevealBesidePayload } from "./revealBeside";

export function activate(context: vscode.ExtensionContext): void {
  const panel = getPanel();
  panel.appendLine("[codingland] host activate (M1 microworld)");

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
      async (uriOrPayload?: vscode.Uri | RevealBesidePayload | string) => {
        await revealBeside(uriOrPayload);
      }
    ),
    vscode.commands.registerCommand("codingland.openCanvas", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (folder) {
        const target = vscode.Uri.joinPath(
          folder.uri,
          ".codingland-canvas.codingland.json"
        );
        await vscode.workspace.fs.writeFile(
          target,
          Buffer.from(
            JSON.stringify(
              { kind: "codingland.canvas", version: 1, milestone: "M1" },
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
        vscode.window.showInformationMessage(
          "Codingland: open a workspace folder to use the Canvas custom editor."
        );
      }
    }),
    vscode.commands.registerCommand("codingland.loadPaymentSample", async () => {
      await vscode.commands.executeCommand("codingland.openCanvas");
      await CanvasEditorProvider.loadPaymentSample(context);
    }),
    panel
  );
}

export function deactivate(): void {
  // no-op
}
