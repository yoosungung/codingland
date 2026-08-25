import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { CanvasEditorProvider } from "./canvasEditorProvider";
import { getPanel, showPanel } from "./panel";
import { revealBeside, type RevealBesidePayload } from "./revealBeside";
import { GateHost, type TriggerGateArgs } from "./gateHost";
import { WorkspaceIngestHost } from "./workspaceIngest";

export function activate(context: vscode.ExtensionContext): void {
  const panel = getPanel();
  panel.appendLine("[codingland] host activate (M4 Workspace Ingest)");

  const sidebar = new SidebarProvider(context.extensionUri);
  const gateHost = new GateHost(sidebar);

  // Register Canvas before ingest so Open Canvas is not stuck behind a long scan.
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
      // WebviewPanel path — avoids stuck CustomTextEditor progress bar.
      await CanvasEditorProvider.openCanvas(context);
    }),
    vscode.commands.registerCommand("codingland.loadPaymentSample", async () => {
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

  const ingestHost = new WorkspaceIngestHost();
  ingestHost.register(context);
}

export function deactivate(): void {
  // no-op
}
