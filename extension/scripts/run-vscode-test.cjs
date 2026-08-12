"use strict";

/**
 * Ensure a desktop VS Code-compatible binary exists for Extension Host tests.
 * Prefer VSCODE_EXECUTABLE_PATH; else download VS Code via @vscode/test-electron;
 * if update.code.visualstudio.com is unreachable (common in locked-down Pods),
 * fall back to a GitHub-hosted VSCodium linux-x64 tarball.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { createWriteStream } = require("fs");
const { pipeline } = require("stream/promises");
const { execFileSync } = require("child_process");

const hostDir = path.join(__dirname, "..", "host");
const cacheRoot = path.join(hostDir, ".vscode-test");

function existsExec(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findBinary(dir, names) {
  for (const name of names) {
    const candidate = path.join(dir, name);
    if (existsExec(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function downloadFile(url, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await new Promise((resolve, reject) => {
    const follow = (u, redirects = 0) => {
      if (redirects > 5) {
        reject(new Error(`too many redirects for ${url}`));
        return;
      }
      https
        .get(u, (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            follow(res.headers.location, redirects + 1);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`download ${u} → HTTP ${res.statusCode}`));
            res.resume();
            return;
          }
          const out = createWriteStream(dest);
          pipeline(res, out).then(resolve).catch(reject);
        })
        .on("error", reject);
    };
    follow(url);
  });
}

function ghLatestVscodiumLinuxUrl() {
  const raw = execFileSync(
    "gh",
    [
      "api",
      "repos/VSCodium/vscodium/releases/latest",
      "--jq",
      '.assets[] | select(.name|test("VSCodium-linux-x64-.*\\\\.tar\\\\.gz$")) | .browser_download_url',
    ],
    { encoding: "utf8" }
  ).trim();
  const url = raw.split("\n").filter(Boolean)[0];
  if (!url) {
    throw new Error("no VSCodium-linux-x64 tarball in latest release");
  }
  return url;
}

async function ensureVscodiumFallback() {
  const extractDir = path.join(cacheRoot, "vscodium-linux-x64");
  const cached = findBinary(extractDir, ["codium", "vscodium", "code"]);
  if (cached) {
    return cached;
  }

  const url = ghLatestVscodiumLinuxUrl();
  const tarball = path.join(cacheRoot, "vscodium-linux-x64.tar.gz");
  console.error(`[test:vscode] CDN blocked; downloading fallback from GitHub:\n  ${url}`);
  await downloadFile(url, tarball);
  await fs.promises.rm(extractDir, { recursive: true, force: true });
  await fs.promises.mkdir(extractDir, { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", extractDir, "--strip-components=1"], {
    stdio: "inherit",
  });
  const bin = findBinary(extractDir, ["codium", "vscodium", "code"]);
  if (!bin) {
    throw new Error(`extracted VSCodium but no binary under ${extractDir}`);
  }
  return bin;
}

async function tryOfficialDownload() {
  try {
    const {
      downloadAndUnzipVSCode,
    } = require("@vscode/test-electron");
    const vscodePath = await Promise.race([
      downloadAndUnzipVSCode("stable"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("official VS Code download timed out")), 45_000)
      ),
    ]);
    return vscodePath;
  } catch (err) {
    console.error(`[test:vscode] official download failed: ${err.message || err}`);
    return null;
  }
}

async function resolveExecutable() {
  if (process.env.VSCODE_EXECUTABLE_PATH) {
    return process.env.VSCODE_EXECUTABLE_PATH;
  }
  const official = await tryOfficialDownload();
  if (official) {
    return official;
  }
  if (process.platform === "linux") {
    return ensureVscodiumFallback();
  }
  throw new Error(
    "Could not download VS Code and no VSCODE_EXECUTABLE_PATH set. " +
      "Set VSCODE_EXECUTABLE_PATH to a local code/codium binary."
  );
}

async function main() {
  const executable = await resolveExecutable();
  process.env.VSCODE_EXECUTABLE_PATH = executable;
  console.error(`[test:vscode] using ${executable}`);

  const linuxHeadless =
    process.platform === "linux" &&
    (!process.env.DISPLAY || process.env.DISPLAY.trim() === "");

  const cmd = linuxHeadless ? "xvfb-run" : "npx";
  const args = linuxHeadless
    ? ["-a", "npx", "vscode-test"]
    : ["vscode-test"];

  const result = spawnSync(cmd, args, {
    cwd: hostDir,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  process.exit(result.status === null ? 1 : result.status);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
