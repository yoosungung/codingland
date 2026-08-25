/**
 * Full VSIX prep: compile + bundle core into host. Manual / CI entry.
 */
const path = require("path");
const { execSync } = require("child_process");

const extensionRoot = path.join(__dirname, "..");

console.log("[prepare-vsix] compile");
execSync("npm run compile", { cwd: extensionRoot, stdio: "inherit" });

console.log("[prepare-vsix] bundle");
execSync("node ./scripts/bundle-for-vsix.cjs", {
  cwd: extensionRoot,
  stdio: "inherit",
});
