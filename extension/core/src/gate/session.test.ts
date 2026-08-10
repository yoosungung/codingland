import { computeChangeScore } from "./changeScore";
import {
  applyConsensus,
  applyTeachBack,
  openGate,
  rejectDraft,
  requestBypass,
  type GateSession,
} from "./session";

function scoreForTier(
  tier: "none" | "light" | "full",
  bypassAllowed = true
) {
  if (tier === "none") {
    return computeChangeScore({
      entropy: 0.1,
      coupling: 0.1,
      criticality: 0.1,
      sessionLoad: 0,
    });
  }
  if (tier === "light") {
    return computeChangeScore({
      entropy: 0.4,
      coupling: 0.4,
      criticality: 0.4,
      sessionLoad: 0,
    });
  }
  const s = computeChangeScore({
    entropy: 0.85,
    coupling: 0.85,
    criticality: bypassAllowed ? 0.5 : 0.9,
    sessionLoad: bypassAllowed ? 0.55 : 0.1,
  });
  expect(s.tier).toBe("full");
  expect(s.bypassAllowed).toBe(bypassAllowed);
  return s;
}

describe("GateSession", () => {
  it("tier none stays explore and can pass without consensus UI", () => {
    const gate = openGate({
      reason: "commit",
      uris: ["file:///a.ts"],
      score: scoreForTier("none"),
    });
    expect(gate.phase).toBe("explore");
    expect(gate.passed).toBe(true);
  });

  it("tier light requires MirrorDraft consensus to pass", () => {
    let gate = openGate({
      reason: "verify",
      uris: ["file:///a.ts"],
      score: scoreForTier("light"),
    });
    expect(gate.phase).toBe("mirror");
    expect(gate.passed).toBe(false);

    gate = applyConsensus(gate, {
      accepted: false,
      draft: { livingSpecMarkdown: "", questions: [] },
    });
    expect(gate.passed).toBe(false);
    expect(gate.phase).toBe("mirror");

    gate = applyConsensus(gate, {
      accepted: true,
      draft: {
        livingSpecMarkdown: "# ok",
        questions: ["why?"],
      },
    });
    expect(gate.passed).toBe(true);
    expect(gate.phase).toBe("passed");
  });

  it("tier full walks Walkthrough → TeachBack → Mirror → Consensus", () => {
    let gate: GateSession = openGate({
      reason: "commit",
      uris: ["file:///a.ts"],
      score: scoreForTier("full"),
      walkthrough: {
        fingerprints: ["fp-a", "fp-b"],
        summary: "path hint",
        pathNodeIds: ["a", "b"],
      },
    });
    expect(gate.phase).toBe("walkthrough");
    expect(gate.passed).toBe(false);

    gate = applyTeachBack(gate, {
      modality: { kind: "spatial", orderedNodeIds: ["a", "b"] },
      nodeFingerprints: ["fp-a", "fp-b"],
      attempt: 1,
    });
    expect(gate.phase).toBe("mirror");

    gate = applyConsensus(gate, {
      accepted: true,
      draft: { livingSpecMarkdown: "# full", questions: [] },
    });
    expect(gate.phase).toBe("passed");
    expect(gate.passed).toBe(true);
  });

  it("rejects draft with progressive hint and lighter modality preference", () => {
    let gate = openGate({
      reason: "commit",
      uris: ["file:///a.ts"],
      score: scoreForTier("full"),
      walkthrough: {
        fingerprints: ["fp-a"],
        summary: "s",
        pathNodeIds: ["a"],
      },
    });
    gate = applyTeachBack(gate, {
      modality: { kind: "text", text: "long explanation" },
      nodeFingerprints: ["fp-a"],
      attempt: 1,
    });
    gate = rejectDraft(gate, { hintNodeIds: ["a", "neighbor"] });
    expect(gate.phase).toBe("teachback");
    expect(gate.preferredModality).toBe("spatial");
    expect(gate.hintNodeIds).toEqual(["a", "neighbor"]);
    expect(gate.passed).toBe(false);
  });

  it("allows bypass only when score.bypassAllowed", () => {
    let denied = openGate({
      reason: "commit",
      uris: ["file:///a.ts"],
      score: scoreForTier("full", false),
      walkthrough: {
        fingerprints: ["fp-a"],
        summary: "s",
        pathNodeIds: ["a"],
      },
    });
    denied = applyTeachBack(denied, {
      modality: { kind: "text", text: "x" },
      nodeFingerprints: ["fp-a"],
      attempt: 99,
    });
    const blocked = requestBypass(denied, { reason: "deadline" });
    expect(blocked.ok).toBe(false);
    expect(blocked.session.phase).not.toBe("bypassed");

    let allowed = openGate({
      reason: "commit",
      uris: ["file:///a.ts"],
      score: scoreForTier("full", true),
      walkthrough: {
        fingerprints: ["fp-a"],
        summary: "s",
        pathNodeIds: ["a"],
      },
    });
    allowed = applyTeachBack(allowed, {
      modality: { kind: "text", text: "x" },
      nodeFingerprints: ["fp-a"],
      attempt: 1,
    });
    const ok = requestBypass(allowed, { reason: "fatigue" });
    expect(ok.ok).toBe(true);
    expect(ok.session.phase).toBe("bypassed");
    expect(ok.session.passed).toBe(false);
    expect(ok.record?.tier).toBe("full");
  });

  it("never auto-bypasses at attempt===3", () => {
    let gate = openGate({
      reason: "commit",
      uris: ["file:///a.ts"],
      score: scoreForTier("full", false),
      walkthrough: {
        fingerprints: ["fp-a"],
        summary: "s",
        pathNodeIds: ["a"],
      },
    });
    for (let attempt = 1; attempt <= 3; attempt++) {
      gate = applyTeachBack(gate, {
        modality: { kind: "text", text: "try" },
        nodeFingerprints: ["fp-a"],
        attempt,
      });
      gate = rejectDraft(gate, { hintNodeIds: ["a"] });
    }
    expect(gate.phase).toBe("teachback");
    expect(gate.passed).toBe(false);
    expect(gate.phase).not.toBe("bypassed");
  });
});
