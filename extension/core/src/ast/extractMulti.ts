import { isExcludedPath } from "../graph/excludeGlob";
import {
  createGraphStore,
  mergeFilesIntoStore,
  type GraphStoreState,
} from "../graph/graphStore";
import type { ExtractInput } from "./extract";

export interface ExtractSourceInput extends ExtractInput {
  /** Workspace-relative path for exclude globs */
  relativePath?: string;
}

export interface ExtractAndMergeOptions {
  applyExclude?: boolean;
  excludeGlobs?: string[];
}

export interface ExtractAndMergeStats {
  filesTouched: number;
  filesSkipped: number;
}

export interface ExtractAndMergeResult {
  store: GraphStoreState;
  delta: import("../graph/types").GraphDelta;
  stats: ExtractAndMergeStats;
}

/**
 * Multi-file workspace extract → GraphStore merge (M4 core slice).
 * Host supplies file contents; exclude is optional via relativePath + globs.
 */
export function extractAndMergeSources(
  inputs: ExtractSourceInput[],
  options: ExtractAndMergeOptions = {}
): ExtractAndMergeResult {
  const toMerge: ExtractInput[] = [];
  let filesSkipped = 0;

  for (const input of inputs) {
    if (
      options.applyExclude &&
      input.relativePath &&
      isExcludedPath(input.relativePath, {
        excludeGlobs: options.excludeGlobs,
      })
    ) {
      filesSkipped += 1;
      continue;
    }
    toMerge.push(input);
  }

  const store = createGraphStore();
  const { store: merged, delta } = mergeFilesIntoStore(store, toMerge);

  return {
    store: merged,
    delta,
    stats: {
      filesTouched: toMerge.length,
      filesSkipped,
    },
  };
}
