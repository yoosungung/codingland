"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { commandExists, softSkipDecision } = require("./xvfbGuard.cjs");

describe("xvfbGuard.commandExists", () => {
  it("finds an executable on a custom PATH", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xvfb-guard-"));
    const bin = path.join(dir, "fake-tool");
    fs.writeFileSync(bin, "#!/bin/sh\n");
    fs.chmodSync(bin, 0o755);
    assert.equal(commandExists("fake-tool", dir), true);
    assert.equal(commandExists("missing-tool", dir), false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("xvfbGuard.softSkipDecision", () => {
  it("does not skip when DISPLAY is set on linux", () => {
    assert.deepEqual(
      softSkipDecision({ platform: "linux", display: ":99", pathEnv: "" }),
      { skip: false }
    );
  });

  it("does not skip on non-linux even without DISPLAY", () => {
    assert.deepEqual(
      softSkipDecision({ platform: "darwin", display: "", pathEnv: "" }),
      { skip: false }
    );
  });

  it("soft-skips linux headless when xvfb-run is absent", () => {
    const result = softSkipDecision({
      platform: "linux",
      display: "",
      pathEnv: "/nonexistent-bin-dir",
    });
    assert.equal(result.skip, true);
    assert.match(result.reason, /soft-skip/i);
    assert.match(result.reason, /xvfb-run/);
  });

  it("does not skip linux headless when xvfb-run is on PATH", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xvfb-guard-"));
    const bin = path.join(dir, "xvfb-run");
    fs.writeFileSync(bin, "#!/bin/sh\n");
    fs.chmodSync(bin, 0o755);
    assert.deepEqual(
      softSkipDecision({ platform: "linux", display: "", pathEnv: dir }),
      { skip: false }
    );
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
