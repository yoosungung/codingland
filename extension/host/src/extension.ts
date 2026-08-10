import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { CanvasEditorProvider } from "./canvasEditorProvider";
import { getPanel, showPanel } from "./panel";
import { revealBeside, type RevealBesidePayload } from "./revealBeside";
import { GateHost, type TriggerGateArgs } from "./gateHost";

export function activate(context: vscode.ExtensionContext): void {
  const panel = getPanel();
  panel.appendLine("[codingland] host activate (M3 Mirror Gate)");

  const sidebar = new SidebarProvider(context.extensionUri);
  const gateHost = new GateHost(sidebar);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebar
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
              { kind: "codingland.canvas", version: 3, milestone: "M3" },
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
    vscode.commands.registerCommand(
      "codingland.triggerGate",
      async (args?: TriggerGateArgs) => {
        const result = await gateHost.trigger(args ?? {});
        void vscode.window.showInformationMessage(
          `Codingland Gate: tier=${result.scoreTier} passed=${result.passed}`
        );
        return result;
      }
    ),
    panel
  );
}

export function deactivate(): void {
  // no-op
}
