import {
  HeuristicMirrorAdapter,
  buildHeuristicMirrorDraft,
  draftMirrorForScore,
} from "./mirrorAdapter";
import { computeChangeScore } from "./changeScore";

describe("HeuristicMirrorAdapter", () => {
  it("builds advisory draft without Pass authority fields beyond SOLO", async () => {
    const score = computeChangeScore({
      entropy: 0.5,
      coupling: 0.5,
      criticality: 0.5,
      sessionLoad: 0.2,
    });
    const draft = await new HeuristicMirrorAdapter().draft({
      score,
      fingerprints: ["fp-a", "fp-b"],
      summary: "auth middleware",
    });
    expect(draft.livingSpecMarkdown).toContain("auth middleware");
    expect(draft.livingSpecMarkdown).toContain("fp-a");
    expect(draft.soloAdvisory).toBe(3);
    expect(draft.questions.length).toBeGreaterThan(0);
    expect(draft.hintNodeIds).toEqual(["fp-a", "fp-b"]);
  });

  it("prefers non-text teach-back prompt when sessionLoad is high", () => {
    const score = computeChangeScore({
      entropy: 0.4,
      coupling: 0.4,
      criticality: 0.4,
      sessionLoad: 0.8,
    });
    const draft = buildHeuristicMirrorDraft({
      score,
      fingerprints: ["fp-x"],
    });
    expect(draft.questions.some((q) => /spatial/i.test(q))).toBe(true);
  });

  it("draftMirrorForScore returns matching tier", async () => {
    const { score, draft } = await draftMirrorForScore(
      { entropy: 0.1, coupling: 0.1, criticality: 0.1, sessionLoad: 0 },
      ["fp-n"]
    );
    expect(score.tier).toBe("none");
    expect(draft.soloAdvisory).toBe(1);
  });
});
