import {
  linkJestStub,
  parseLivingSpec,
  type LivingSpecArtifact,
} from "./livingSpec";

describe("LivingSpec", () => {
  const markdown = `---
fingerprints:
  - fp-charge
scenarios:
  - scenarioId: pay-reject-expired
    bdd: |
      Given an expired token
      When charge is called
      Then reject with 401
---
# Charge
`;

  it("parses sidecar markdown into LivingSpecArtifact", () => {
    const art = parseLivingSpec("src/pay.ts.codingland.md", markdown);
    expect(art.path).toBe("src/pay.ts.codingland.md");
    expect(art.fingerprints).toEqual(["fp-charge"]);
    expect(art.scenarios).toHaveLength(1);
    expect(art.scenarios[0].scenarioId).toBe("pay-reject-expired");
    expect(art.scenarios[0].bdd).toMatch(/expired token/);
  });

  it("links Jest stub path 1:1 by scenarioId", () => {
    const art = parseLivingSpec("src/pay.ts.codingland.md", markdown);
    const linked = linkJestStub(
      art,
      "pay-reject-expired",
      "src/pay.pay-reject-expired.test.ts"
    );
    expect(linked.scenarios[0].jestPath).toBe(
      "src/pay.pay-reject-expired.test.ts"
    );
  });

  it("rejects linking unknown scenarioId (orphan Jest 금지)", () => {
    const art = parseLivingSpec("src/pay.ts.codingland.md", markdown);
    expect(() =>
      linkJestStub(art, "unknown-id", "src/orphan.test.ts")
    ).toThrow(/unknown scenarioId/i);
  });

  it("preserves consensusAt when re-linking", () => {
    const base: LivingSpecArtifact = {
      path: "x.md",
      fingerprints: [],
      scenarios: [{ scenarioId: "s1", bdd: "Given x" }],
      consensusAt: "2026-08-06T00:00:00Z",
    };
    const linked = linkJestStub(base, "s1", "s1.test.ts");
    expect(linked.consensusAt).toBe("2026-08-06T00:00:00Z");
  });
});
