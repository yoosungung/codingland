import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { createGraphStore, mergeFileIntoStore } from "@codingland/core";
import { WorkspaceIngestHost } from "../workspaceIngest";

const FIXTURE = {
  source:
    "export function alpha() { return beta(); }\nfunction beta() { return 1; }",
  fileName: "a.ts",
};

suite("WorkspaceIngestHost ingestUri", () => {
  let wsRoot: string;
  let ingestUri: vscode.Uri;

  suiteSetup(async () => {
    wsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codingland-ingest-"));
    const fixtureDir = path.join(wsRoot, "src-fixture");
    await fs.promises.mkdir(fixtureDir, { recursive: true });
    const fixturePath = path.join(fixtureDir, FIXTURE.fileName);
    await fs.promises.writeFile(fixturePath, FIXTURE.source, "utf8");
    ingestUri = vscode.Uri.file(fixturePath);
  });

  suiteTeardown(() => {
    fs.rmSync(wsRoot, { recursive: true, force: true });
  });

  test("returns delta for ingestible uri and skips excluded paths", async () => {
    const expected = mergeFileIntoStore(createGraphStore(), {
      source: FIXTURE.source,
      uri: ingestUri.toString(),
      fileName: FIXTURE.fileName,
    });

    const host = new WorkspaceIngestHost();
    const delta = await host.ingestUri(ingestUri, { pushCanvas: false });

    assert.ok(delta, "ingestUri should return a delta");
    assert.strictEqual(
      delta!.upsertNodes?.length ?? 0,
      expected.delta.upsertNodes?.length ?? 0
    );

    const excludedUri = vscode.Uri.file(
      path.join(wsRoot, "node_modules", "pkg", "index.ts")
    );
    const skipped = await host.ingestUri(excludedUri, { pushCanvas: false });
    assert.strictEqual(skipped, undefined);
  });
});
