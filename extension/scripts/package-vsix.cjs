/**
 * Stage host + bundled node_modules outside workspace, then vsce package.
 * M4 #1278 — avoids duplicate extension/node_modules paths in VSIX.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const extensionRoot = path.join(__dirname, "..");
const hostRoot = path.join(extensionRoot, "host");
const stageRoot = path.join(extensionRoot, ".vsix-stage");

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: false });
}

console.log("[package-vsix] bundle runtime deps");
execSync("node ./scripts/bundle-for-vsix.cjs", {
  cwd: extensionRoot,
  stdio: "inherit",
});

console.log("[package-vsix] stage extension tree");
rmrf(stageRoot);
fs.mkdirSync(stageRoot, { recursive: true });

copyDir(path.join(hostRoot, "out"), path.join(stageRoot, "out"));
copyDir(path.join(hostRoot, "media"), path.join(stageRoot, "media"));
copyDir(path.join(hostRoot, "node_modules"), path.join(stageRoot, "node_modules"));
fs.copyFileSync(
  path.join(hostRoot, "package.json"),
  path.join(stageRoot, "package.json")
);
fs.copyFileSync(
  path.join(hostRoot, "README.md"),
  path.join(stageRoot, "README.md")
);

console.log("[package-vsix] vsce package from stage");
rmrf(path.join(hostRoot, "codingland-0.0.1.vsix"));
execSync("npx @vscode/vsce package --allow-missing-repository", {
  cwd: stageRoot,
  stdio: "inherit",
});

const vsixName = "codingland-0.0.1.vsix";
fs.copyFileSync(
  path.join(stageRoot, vsixName),
  path.join(hostRoot, vsixName)
);

const sizeKb = (fs.statSync(path.join(hostRoot, vsixName)).size / 1024).toFixed(1);
console.log(`[package-vsix] wrote host/${vsixName} (${sizeKb} KB)`);
