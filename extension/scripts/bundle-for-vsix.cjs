/**
 * Bundle @codingland/core + runtime deps into host/node_modules (no symlinks).
 * Called by vsce prepublish after compile. M4 #1278.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const extensionRoot = path.join(__dirname, "..");
const hostRoot = path.join(extensionRoot, "host");
const coreRoot = path.join(extensionRoot, "core");
const extensionNodeModules = path.join(extensionRoot, "node_modules");
const hostNodeModules = path.join(hostRoot, "node_modules");

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyPackageReal(src, dest) {
  rmrf(dest);
  fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: false });
}

function depPaths(root, packageName) {
  if (packageName.startsWith("@")) {
    const idx = packageName.indexOf("/");
    const scope = packageName.slice(0, idx);
    const name = packageName.slice(idx + 1);
    return path.join(root, scope, name);
  }
  return path.join(root, packageName);
}

function copyRuntimeDeps(
  packageName,
  destRoot,
  srcRoot,
  seen = new Set()
) {
  if (seen.has(packageName)) {
    return;
  }
  seen.add(packageName);

  const rel = depPaths("", packageName);
  const src = path.join(srcRoot, rel);
  if (!fs.existsSync(src)) {
    console.warn(`[bundle-for-vsix] missing dep ${packageName} at ${src}`);
    return;
  }

  const dest = path.join(destRoot, rel);
  copyPackageReal(src, dest);

  const pkgPath = path.join(src, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  for (const dep of Object.keys(pkg.dependencies || {})) {
    copyRuntimeDeps(dep, destRoot, srcRoot, seen);
  }
}

console.log("[bundle-for-vsix] npm pack @codingland/core");
const tgzName = execSync("npm pack --pack-destination .", {
  cwd: coreRoot,
  encoding: "utf8",
}).trim();
const tgzPath = path.join(coreRoot, tgzName);

const coreTarget = path.join(hostNodeModules, "@codingland", "core");
rmrf(hostNodeModules);
fs.mkdirSync(coreTarget, { recursive: true });

console.log("[bundle-for-vsix] extract core tarball into host/node_modules");
execSync(`tar -xzf "${tgzPath}" -C "${coreTarget}" --strip-components=1 package`, {
  stdio: "inherit",
});

const corePkg = JSON.parse(
  fs.readFileSync(path.join(coreTarget, "package.json"), "utf8")
);
console.log("[bundle-for-vsix] copy runtime dependency tree");
for (const dep of Object.keys(corePkg.dependencies || {})) {
  copyRuntimeDeps(dep, hostNodeModules, extensionNodeModules);
}

fs.unlinkSync(tgzPath);
console.log("[bundle-for-vsix] done");
