const mockPanelLines: string[] = [];

jest.mock("vscode", () => ({
  workspace: {
    findFiles: jest.fn(),
    asRelativePath: (uri: { path: string }) => uri.path.replace(/^\/ws\//, ""),
    fs: {
      readFile: jest.fn(),
    },
  },
  window: {},
  Uri: {
    file: (p: string) => ({ path: p, toString: () => `file://${p}` }),
  },
}), { virtual: true });

jest.mock("./panel", () => ({
  getPanel: () => ({
    appendLine: (line: string) => {
      mockPanelLines.push(line);
    },
  }),
}));

jest.mock("./canvasEditorProvider", () => ({
  CanvasEditorProvider: {
    setWorkspaceGraph: jest.fn(async () => undefined),
    applyWorkspaceDelta: jest.fn(async () => undefined),
  },
}));

import * as vscode from "vscode";
import { WorkspaceIngestHost } from "./workspaceIngest";

function fileUri(name: string): { path: string; toString: () => string } {
  const path = `/ws/src/${name}`;
  return { path, toString: () => `file://${path}` };
}

describe("WorkspaceIngestHost scan counts", () => {
  beforeEach(() => {
    mockPanelLines.length = 0;
    const readFile = vscode.workspace.fs.readFile as unknown as jest.Mock;
    readFile.mockImplementation(async (uri: { path?: string }) => {
      if (uri?.path?.endsWith("bad.ts")) {
        throw new Error("read failed");
      }
      return Buffer.from("export function alpha() { return 1; }\n");
    });
    (vscode.workspace.findFiles as unknown as jest.Mock).mockResolvedValue([
      fileUri("ok.ts"),
      fileUri("bad.ts"),
    ]);
  });

  it("counts a read failure as skipped, not ingested", async () => {
    const host = new WorkspaceIngestHost();
    const snapshot = await host.scanWorkspace({ showProgress: false });

    const complete = mockPanelLines.find((line) =>
      line.includes("ingest complete")
    );
    expect(complete).toContain("1 files, 1 skipped");
    expect(mockPanelLines.some((line) => line.includes("ingest skip") && line.includes("bad.ts"))).toBe(
      true
    );
    expect(snapshot.nodes.length).toBeGreaterThan(0);
  });
});
