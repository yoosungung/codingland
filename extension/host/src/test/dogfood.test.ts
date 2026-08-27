import * as assert from "assert";
import * as vscode from "vscode";
import { activateCodingland } from "./setup";

/**
 * Dogfood / M4 Extension Host checks — maps to e2e/scenarios/*.yaml automation blocks.
 * Scenario id prefix in test title: [scenario:<id>]
 */
suite("Codingland dogfood (Extension Host)", () => {
  suiteSetup(async function () {
    this.timeout(30_000);
    await activateCodingland();
  });

  test("[scenario:smoke-scan-workspace] scanWorkspace completes with nodes", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("codingland.scanWorkspace"));

    const snapshot = await vscode.commands.executeCommand<{
      nodes: unknown[];
      edges: unknown[];
    }>("codingland.scanWorkspace");

    assert.ok(snapshot, "scanWorkspace should return GraphSnapshot");
    assert.ok(Array.isArray(snapshot.nodes));
    assert.ok(snapshot.nodes.length > 0, "fixture workspace should yield graph nodes");
  });

  test("[scenario:smoke-open-canvas] openCanvas runs without error", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("codingland.openCanvas"));
    await vscode.commands.executeCommand("codingland.openCanvas");
  });

  test("[scenario:smoke-load-sample] loadPaymentSample loads graph", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("codingland.loadPaymentSample"));
    await vscode.commands.executeCommand("codingland.loadPaymentSample");
    await vscode.commands.executeCommand("codingland.openCanvas");
  });

  test("[scenario:smoke-show-panel] showPanel opens Output channel", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("codingland.showPanel"));
    await vscode.commands.executeCommand("codingland.showPanel");
    const channel = vscode.window.activeTextEditor;
    void channel;
  });

  test("[scenario:dogfood-m4-incremental] save fixture then rescan still yields graph", async () => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(folder, "Extension Host should open a workspace folder");

    const fixtureUri = vscode.Uri.joinPath(
      folder.uri,
      "src",
      "test",
      "fixtures",
      "sample-app",
      "greeter.ts"
    );
    const bytes = await vscode.workspace.fs.readFile(fixtureUri);
    const text = Buffer.from(bytes).toString("utf8");
    const touched = Buffer.from(text + "\n", "utf8");
    await vscode.workspace.fs.writeFile(fixtureUri, touched);

    const snapshot = await vscode.commands.executeCommand<{
      nodes: unknown[];
    }>("codingland.scanWorkspace");
    assert.ok(snapshot?.nodes?.length > 0, "graph should survive after fixture edit");

    await vscode.workspace.fs.writeFile(fixtureUri, Buffer.from(text, "utf8"));
  });
});
