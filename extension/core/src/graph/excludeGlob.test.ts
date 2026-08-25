import {
  DEFAULT_EXCLUDE_GLOBS,
  isExcludedPath,
  matchGlob,
} from "./excludeGlob";

describe("excludeGlob", () => {
  it("matches simple globs", () => {
    expect(matchGlob("src/foo.ts", "*.ts")).toBe(false);
    expect(matchGlob("foo.ts", "*.ts")).toBe(true);
    expect(matchGlob("lib/foo.ts", "**/*.ts")).toBe(true);
  });

  it("excludes node_modules, dist, out, .git, test caches by default", () => {
    expect(isExcludedPath("node_modules/pkg/index.js")).toBe(true);
    expect(isExcludedPath("src/node_modules/foo.ts")).toBe(true);
    expect(isExcludedPath("dist/bundle.js")).toBe(true);
    expect(isExcludedPath("out/extension.js")).toBe(true);
    expect(isExcludedPath("host/out/extension.js")).toBe(true);
    expect(isExcludedPath(".git/HEAD")).toBe(true);
    expect(isExcludedPath("extension/.vscode-test/vscode-darwin/bin.js")).toBe(
      true
    );
    expect(isExcludedPath("extension/.vsix-stage/tmp.js")).toBe(true);
    expect(isExcludedPath("src/index.ts")).toBe(false);
    expect(isExcludedPath("lib/utils.ts")).toBe(false);
  });

  it("honours custom exclude globs", () => {
    expect(
      isExcludedPath("coverage/lcov.info", { excludeGlobs: ["**/coverage/**"] })
    ).toBe(true);
    expect(
      isExcludedPath("src/index.ts", { excludeGlobs: ["**/coverage/**"] })
    ).toBe(false);
  });

  it("exports default exclude globs for host", () => {
    expect(DEFAULT_EXCLUDE_GLOBS).toEqual(
      expect.arrayContaining([
        "**/node_modules/**",
        "**/dist/**",
        "**/out/**",
        "**/.git/**",
        "**/.vscode-test/**",
        "**/.vsix-stage/**",
      ])
    );
  });
});
