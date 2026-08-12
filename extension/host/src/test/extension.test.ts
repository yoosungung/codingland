import * as assert from "assert";
import * as vscode from "vscode";

suite("Codingland Extension Host smoke", () => {
  test("extension activates", async () => {
    const ext = vscode.extensions.getExtension("yoosungung.codingland");
    assert.ok(ext, "yoosungung.codingland should be present");
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true);
  });

  test("codingland.triggerGate command runs", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("codingland.triggerGate"),
      "codingland.triggerGate should be registered"
    );

    const result = await vscode.commands.executeCommand<{
      passed: boolean;
      scoreTier: string;
    }>("codingland.triggerGate", {
      entropy: 0.2,
      coupling: 0.2,
      criticality: 0.2,
      sessionLoad: 0,
      accept: true,
    });

    assert.ok(result, "triggerGate should return a GateSmokeResult");
    assert.strictEqual(typeof result.passed, "boolean");
    assert.ok(
      ["none", "light", "full"].includes(result.scoreTier),
      `unexpected scoreTier: ${result.scoreTier}`
    );
  });
});
