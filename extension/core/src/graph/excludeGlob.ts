/** Default Workspace Ingest exclude globs (ARCHITECTURE §1.15 / ROADMAP M4). */
export const DEFAULT_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
];

export interface ExcludePathOptions {
  excludeGlobs?: string[];
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\//, "");
}

/**
 * Minimal glob matcher for ingest exclude/include (no vscode dependency).
 * Supports `*`, `**`, and `?` in path segments.
 */
export function matchGlob(path: string, pattern: string): boolean {
  const normalized = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);
  const regex = globToRegExp(normalizedPattern);
  return regex.test(normalized);
}

function globToRegExp(glob: string): RegExp {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") {
        re += "(?:.*/)?";
        i += 2;
      } else {
        re += ".*";
        i += 1;
      }
    } else if (c === "*") {
      re += "[^/]*";
    } else if (c === "?") {
      re += ".";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  re += "$";
  return new RegExp(re);
}

export function isExcludedPath(
  relativePath: string,
  options: ExcludePathOptions = {}
): boolean {
  const patterns =
    options.excludeGlobs?.length
      ? options.excludeGlobs
      : DEFAULT_EXCLUDE_GLOBS;
  const normalized = normalizePath(relativePath);
  return patterns.some((pattern) => matchGlob(normalized, pattern));
}
