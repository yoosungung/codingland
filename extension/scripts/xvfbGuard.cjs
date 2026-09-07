"use strict";

/**
 * Linux headless Extension Host needs xvfb-run (or an existing DISPLAY).
 * When xvfb-run is missing, soft-skip instead of spawnSync ENOENT hard-fail
 * so unit floors (npm test / clean_code) are not discarded.
 */

const fs = require("fs");
const path = require("path");

function existsExec(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function commandExists(bin, pathEnv = process.env.PATH || "") {
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    if (existsExec(path.join(dir, bin))) return true;
  }
  return false;
}

/**
 * @returns {{ skip: boolean, reason?: string }}
 */
function softSkipDecision({
  platform = process.platform,
  display = process.env.DISPLAY,
  pathEnv = process.env.PATH || "",
} = {}) {
  const linuxHeadless =
    platform === "linux" && (!display || String(display).trim() === "");
  if (!linuxHeadless) {
    return { skip: false };
  }
  if (commandExists("xvfb-run", pathEnv)) {
    return { skip: false };
  }
  return {
    skip: true,
    reason:
      "[test:vscode] soft-skip: Linux headless but xvfb-run not found on PATH. " +
      "Install xvfb (or set DISPLAY) to run Extension Host smoke; unit tests remain the always-on floor.",
  };
}

module.exports = { commandExists, softSkipDecision, existsExec };
