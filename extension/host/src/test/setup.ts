import * as vscode from "vscode";

/** Activate yoosungung.codingland before scenario suites. */
export async function activateCodingland(): Promise<vscode.Extension<void>> {
  const ext = vscode.extensions.getExtension("yoosungung.codingland");
  if (!ext) {
    throw new Error("yoosungung.codingland not found in Extension Host");
  }
  if (!ext.isActive) {
    await ext.activate();
  }
  return ext;
}
