import { defineConfig } from "@vscode/test-cli";

const fromPath = process.env.VSCODE_EXECUTABLE_PATH;

/** CI/headless-safe Electron flags for Extension Development Host. */
export default defineConfig({
  files: "out/test/**/*.test.js",
  mocha: {
    ui: "tdd",
    timeout: 60_000,
  },
  ...(fromPath ? { useInstallation: { fromPath } } : {}),
  launchArgs: [
    "--disable-extensions",
    "--disable-gpu",
    "--disable-gpu-sandbox",
    "--disable-dev-shm-usage",
    "--no-sandbox",
  ],
});
