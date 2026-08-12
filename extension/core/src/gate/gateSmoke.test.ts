import { runGateSmoke } from "./gateSmoke";

describe("runGateSmoke (host E2E stand-in)", () => {
  it("none tier passes without consensus UI", async () => {
    const r = await runGateSmoke({
      scoreInput: {
        entropy: 0.1,
        coupling: 0.1,
        criticality: 0.1,
        sessionLoad: 0,
      },
      uris: ["file:///a.ts"],
    });
    expect(r.scoreTier).toBe("none");
    expect(r.passed).toBe(true);
    expect(r.session.phase).toBe("explore");
  });

  it("light tier does not pass without accept", async () => {
    const denied = await runGateSmoke({
      scoreInput: {
        entropy: 0.4,
        coupling: 0.4,
        criticality: 0.4,
        sessionLoad: 0,
      },
      uris: ["file:///a.ts"],
      accept: false,
    });
    expect(denied.scoreTier).toBe("light");
    expect(denied.passed).toBe(false);

    const ok = await runGateSmoke({
      scoreInput: {
        entropy: 0.4,
        coupling: 0.4,
        criticality: 0.4,
        sessionLoad: 0,
      },
      uris: ["file:///a.ts"],
      accept: true,
    });
    expect(ok.passed).toBe(true);
    expect(ok.draftMarkdown).toContain("Living Spec");
  });

  it("full tier walks teach-back then consensus", async () => {
    const r = await runGateSmoke({
      scoreInput: {
        entropy: 0.85,
        coupling: 0.85,
        criticality: 0.5,
        sessionLoad: 0.1,
      },
      uris: ["file:///a.ts"],
      walkthrough: {
        fingerprints: ["fp-a", "fp-b"],
        summary: "payment path",
        pathNodeIds: ["a", "b"],
      },
      accept: true,
    });
    expect(r.scoreTier).toBe("full");
    expect(r.passed).toBe(true);
    expect(r.session.phase).toBe("passed");
  });

  it("high sessionLoad downshifts full toward light", async () => {
    const r = await runGateSmoke({
      scoreInput: {
        entropy: 0.7,
        coupling: 0.7,
        criticality: 0.7,
        sessionLoad: 0.75,
      },
      uris: ["file:///a.ts"],
      accept: true,
    });
    expect(r.scoreTier).toBe("light");
    expect(r.passed).toBe(true);
  });
});
