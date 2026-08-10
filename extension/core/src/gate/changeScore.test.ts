import { computeChangeScore } from "./changeScore";

describe("computeChangeScore", () => {
  it("maps low severity to none without sessionLoad pressure", () => {
    const score = computeChangeScore({
      entropy: 0.1,
      coupling: 0.1,
      criticality: 0.1,
      sessionLoad: 0,
    });
    expect(score.tier).toBe("none");
    expect(score.sessionLoad).toBe(0);
  });

  it("maps mid severity to light", () => {
    const score = computeChangeScore({
      entropy: 0.4,
      coupling: 0.4,
      criticality: 0.4,
      sessionLoad: 0,
    });
    expect(score.tier).toBe("light");
  });

  it("maps high severity to full", () => {
    const score = computeChangeScore({
      entropy: 0.8,
      coupling: 0.8,
      criticality: 0.8,
      sessionLoad: 0,
    });
    expect(score.tier).toBe("full");
  });

  it("downshifts tier when sessionLoad is high (full → light)", () => {
    const base = computeChangeScore({
      entropy: 0.7,
      coupling: 0.7,
      criticality: 0.7,
      sessionLoad: 0,
    });
    expect(base.tier).toBe("full");

    const loaded = computeChangeScore({
      entropy: 0.7,
      coupling: 0.7,
      criticality: 0.7,
      sessionLoad: 0.75,
    });
    expect(loaded.tier).toBe("light");
  });

  it("does not lock apply — score is pure (no side effects)", () => {
    const a = computeChangeScore({
      entropy: 0.5,
      coupling: 0.5,
      criticality: 0.5,
      sessionLoad: 0.2,
    });
    const b = computeChangeScore({
      entropy: 0.5,
      coupling: 0.5,
      criticality: 0.5,
      sessionLoad: 0.2,
    });
    expect(a).toEqual(b);
  });

  it("sets bypassAllowed from score policy, not attempt count", () => {
    const fatigued = computeChangeScore({
      entropy: 0.9,
      coupling: 0.9,
      criticality: 0.9,
      sessionLoad: 0.6,
    });
    expect(fatigued.bypassAllowed).toBe(true);

    const critical = computeChangeScore({
      entropy: 0.9,
      coupling: 0.9,
      criticality: 0.85,
      sessionLoad: 0.1,
    });
    expect(critical.bypassAllowed).toBe(false);
  });

  it("clamps inputs to 0..1", () => {
    const score = computeChangeScore({
      entropy: 2,
      coupling: -1,
      criticality: 0.5,
      sessionLoad: 1.5,
    });
    expect(score.entropy).toBe(1);
    expect(score.coupling).toBe(0);
    expect(score.sessionLoad).toBe(1);
  });
});
