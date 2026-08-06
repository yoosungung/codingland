import * as fs from "fs";
import * as path from "path";

describe("@codingland/core isolation", () => {
  it("package.json has no vscode dependency", () => {
    const pkgPath = path.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.vscode).toBeUndefined();
    expect(pkg.peerDependencies?.vscode).toBeUndefined();
  });

  it("source files do not import vscode", () => {
    const srcRoot = path.join(__dirname, "..");
    const offenders: string[] = [];

    function walk(dir: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) {
          continue;
        }
        const text = fs.readFileSync(full, "utf8");
        if (/from\s+['"]vscode['"]/.test(text) || /require\(\s*['"]vscode['"]\s*\)/.test(text)) {
          offenders.push(path.relative(srcRoot, full));
        }
      }
    }

    walk(srcRoot);
    expect(offenders).toEqual([]);
  });
});
