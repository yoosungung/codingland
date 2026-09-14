"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
);

describe("extension package.json scripts", () => {
  it("keeps ci and test:vscode gate keys (clean_code / e2e pointers)", () => {
    assert.equal(typeof pkg.scripts.ci, "string");
    assert.equal(typeof pkg.scripts["test:vscode"], "string");
    assert.match(pkg.scripts.ci, /\bnpm test\b/);
    assert.match(pkg.scripts.ci, /test:vscode/);
  });

  it("runs compile before host jest in ci (fresh clone needs @codingland/core dist)", () => {
    const ci = pkg.scripts.ci;
    const compileIdx = ci.search(/\bnpm run compile\b/);
    const testIdx = ci.search(/\bnpm test\b/);
    assert.ok(compileIdx >= 0, "ci must invoke npm run compile");
    assert.ok(testIdx >= 0, "ci must invoke npm test");
    assert.ok(
      compileIdx < testIdx,
      `compile must precede npm test in ci (got: ${ci})`
    );
  });
});
