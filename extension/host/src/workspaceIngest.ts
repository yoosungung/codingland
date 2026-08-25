import * as vscode from "vscode";
import {
  DEFAULT_EXCLUDE_GLOBS,
  createGraphStore,
  isExcludedPath,
  mergeFileIntoStore,
  removeUriFromStore,
  type GraphDelta,
  type GraphStoreState,
  type GraphSnapshot,
} from "@codingland/core";
import { CanvasEditorProvider } from "./canvasEditorProvider";
import { getPanel } from "./panel";

const SOURCE_GLOBS = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.mjs",
  "**/*.cjs",
];

const SOURCE_PATTERN = `{${SOURCE_GLOBS.join(",")}}`;
const EXCLUDE_PATTERN = `{${DEFAULT_EXCLUDE_GLOBS.join(",")}}`;

const TS_JS_EXT = /\.(tsx?|jsx?|mjs|cjs)$/i;

export interface ScanWorkspaceOptions {
  /** Show notification progress (default true for explicit command). */
  showProgress?: boolean;
  cancellation?: vscode.CancellationToken;
  onProgress?: (filesDone: number, filesTotal?: number, uri?: string) => void;
}

/** Host Workspace Ingest - file I/O + watcher; core GraphStore merge (M4 #1277). */
export class WorkspaceIngestHost {
  private store: GraphStoreState = createGraphStore();

  register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand("codingland.scanWorkspace", async () => {
        await this.scanWorkspace({ showProgress: true });
      }),
      this.createWatcher()
    );

    if (vscode.workspace.workspaceFolders?.length) {
      void this.scanWorkspace({ showProgress: false });
    }
  }

  async scanWorkspace(options: ScanWorkspaceOptions = {}): Promise<GraphSnapshot> {
    const uris = await vscode.workspace.findFiles(
      SOURCE_PATTERN,
      EXCLUDE_PATTERN
    );
    const runnable = () => this.ingestUris(uris, options);
    if (options.showProgress) {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Codingland: scanning workspace",
          cancellable: true,
        },
        async (progress, token) => {
          return await this.ingestUris(uris, {
            ...options,
            cancellation: token,
            onProgress: (done, total, uri) => {
              progress.report({
                message: uri ? vscode.workspace.asRelativePath(uri) : undefined,
                increment: total ? 100 / total : undefined,
              });
              options.onProgress?.(done, total, uri?.toString());
            },
          });
        }
      );
    }
    return await runnable();
  }

  private async ingestUris(
    uris: vscode.Uri[],
    options: ScanWorkspaceOptions
  ): Promise<GraphSnapshot> {
    this.store = createGraphStore();
    const panel = getPanel();
    panel.appendLine(
      `[codingland] ingest full scan - ${uris.length} candidate files`
    );

    let done = 0;
    for (const uri of uris) {
      if (options.cancellation?.isCancellationRequested) {
        panel.appendLine("[codingland] ingest scan cancelled");
        break;
      }
      const relativePath = vscode.workspace.asRelativePath(uri);
      if (isExcludedPath(relativePath)) {
        continue;
      }
      await this.ingestUri(uri, { pushCanvas: false });
      done += 1;
      options.onProgress?.(done, uris.length, uri.toString());
    }

    await CanvasEditorProvider.setWorkspaceGraph(this.store.graph);
    panel.appendLine(
      `[codingland] ingest complete - ${done} files, ${this.store.graph.nodes.length} nodes`
    );
    return this.store.graph;
  }

  async ingestUri(
    uri: vscode.Uri,
    options: { pushCanvas?: boolean } = {}
  ): Promise<GraphDelta | undefined> {
    const relativePath = vscode.workspace.asRelativePath(uri);
    if (!TS_JS_EXT.test(uri.path)) {
      return undefined;
    }
    if (isExcludedPath(relativePath)) {
      return undefined;
    }

    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const source = Buffer.from(bytes).toString("utf8");
      const fileName = uri.path.split("/").pop() ?? "source.ts";
      const { store, delta } = mergeFileIntoStore(this.store, {
        source,
        uri: uri.toString(),
        fileName,
      });
      this.store = store;
      getPanel().appendLine(
        `[codingland] ingest ${relativePath} (+${delta.upsertNodes?.length ?? 0} nodes)`
      );
      if (options.pushCanvas ?? true) {
        await CanvasEditorProvider.applyWorkspaceDelta(delta);
      }
      return delta;
    } catch (err) {
      getPanel().appendLine(
        `[codingland] ingest skip ${relativePath}: ${String(err)}`
      );
      return undefined;
    }
  }

  async removeUri(uri: vscode.Uri): Promise<GraphDelta | undefined> {
    const { store, delta } = removeUriFromStore(this.store, uri.toString());
    this.store = store;
    if ((delta.removeNodeIds?.length ?? 0) > 0) {
      getPanel().appendLine(
        `[codingland] ingest removed ${vscode.workspace.asRelativePath(uri)}`
      );
      await CanvasEditorProvider.applyWorkspaceDelta(delta);
    }
    return delta;
  }

  private createWatcher(): vscode.FileSystemWatcher {
    const watcher = vscode.workspace.createFileSystemWatcher(SOURCE_PATTERN);
    watcher.onDidChange((uri) => void this.ingestUri(uri));
    watcher.onDidCreate((uri) => void this.ingestUri(uri));
    watcher.onDidDelete((uri) => void this.removeUri(uri));
    return watcher;
  }
}
