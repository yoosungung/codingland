import {
  BYPASS_COMMIT_TAG,
  formatBypassCommitMessage,
  syncLivingSpec,
} from "./specSync";
import type { LivingSpecArtifact } from "./livingSpec";

function artifact(
  overrides: Partial<LivingSpecArtifact> = {}
): LivingSpecArtifact {
  return {
    path: "src/foo.ts.codingland.md",
    fingerprints: ["fp-old", "fp-keep"],
    scenarios: [
      { scenarioId: "s1", bdd: "Given x", jestPath: "s1.test.ts" },
    ],
    consensusAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("syncLivingSpec", () => {
  it("renames a fingerprint in the mapping", () => {
    const next = syncLivingSpec(artifact(), {
      kind: "rename",
      fromFingerprint: "fp-old",
      toFingerprint: "fp-new",
      nextPath: "src/bar.ts.codingland.md",
    });
    expect(next.fingerprints).toEqual(["fp-new", "fp-keep"]);
    expect(next.path).toBe("src/bar.ts.codingland.md");
  });

  it("deletes a fingerprint and drops empty artifact path when none left", () => {
    const next = syncLivingSpec(
      artifact({ fingerprints: ["fp-gone"] }),
      { kind: "delete", fingerprint: "fp-gone" }
    );
    expect(next.fingerprints).toEqual([]);
    expect(next.deleted).toBe(true);
  });

  it("no-ops when rename target fingerprint is absent", () => {
    const src = artifact();
    const next = syncLivingSpec(src, {
      kind: "rename",
      fromFingerprint: "missing",
      toFingerprint: "fp-x",
    });
    expect(next.fingerprints).toEqual(src.fingerprints);
    expect(next.changed).toBe(false);
  });
});

describe("Bypass commit tag", () => {
  it("uses the fixed epistemic-debt tag string", () => {
    expect(BYPASS_COMMIT_TAG).toBe("[Bypassed Epistemic Debt]");
    expect(formatBypassCommitMessage("fix: harden auth")).toContain(
      BYPASS_COMMIT_TAG
    );
  });
});
