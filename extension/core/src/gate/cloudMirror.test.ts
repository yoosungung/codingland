import { computeChangeScore } from "./changeScore";
import {
  CloudMirrorAdapter,
  resolveMirrorAdapter,
  sanitizeMirrorRequest,
} from "./cloudMirror";
import { HeuristicMirrorAdapter } from "./mirrorAdapter";
import { DEFAULT_SANITIZE_OPTIONS } from "../runtime/sanitize";

describe("resolveMirrorAdapter", () => {
  it("defaults to local Heuristic when cloudOptIn is omitted/false", () => {
    expect(resolveMirrorAdapter().kind).toBe("local");
    expect(resolveMirrorAdapter({ cloudOptIn: false }).kind).toBe("local");
    expect(resolveMirrorAdapter().adapter).toBeInstanceOf(
      HeuristicMirrorAdapter
    );
  });

  it("selects CloudMirrorAdapter only when cloudOptIn is true", () => {
    const resolved = resolveMirrorAdapter({ cloudOptIn: true });
    expect(resolved.kind).toBe("cloud");
    expect(resolved.adapter).toBeInstanceOf(CloudMirrorAdapter);
  });
});

describe("CloudMirrorAdapter", () => {
  const score = computeChangeScore({
    entropy: 0.5,
    coupling: 0.5,
    criticality: 0.5,
    sessionLoad: 0.2,
  });

  it("sanitizes JSON livingSpecSeed keys before drafting", async () => {
    const adapter = new CloudMirrorAdapter({
      ...DEFAULT_SANITIZE_OPTIONS,
      astSensitiveParams: ["apiKey"],
    });
    const draft = await adapter.draft({
      score,
      fingerprints: ["fp-a"],
      summary: "rotate credentials",
      livingSpecSeed: JSON.stringify({
        password: "hunter2",
        apiKey: "leak",
        note: "ok",
      }),
    });
    expect(draft.livingSpecMarkdown).toContain("mirror-backend: cloud-opt-in");
    expect(draft.livingSpecMarkdown).not.toContain("hunter2");
    expect(draft.livingSpecMarkdown).not.toContain("leak");
    expect(draft.livingSpecMarkdown).toContain("[REDACTED]");
    expect(draft.livingSpecMarkdown).toContain("ok");
    expect(draft.questions.some((q) => q.includes("cloud opt-in"))).toBe(true);
  });
});

describe("sanitizeMirrorRequest", () => {
  it("leaves free-text summary intact while redacting JSON seed keys", () => {
    const score = computeChangeScore({
      entropy: 0.1,
      coupling: 0.1,
      criticality: 0.1,
      sessionLoad: 0,
    });
    const cleaned = sanitizeMirrorRequest(
      {
        score,
        fingerprints: ["ok"],
        summary: "plain",
        livingSpecSeed: JSON.stringify({ token: "t", keep: 1 }),
      },
      {
        maxDepth: 3,
        namePatterns: ["password", "token", "secret"],
        astSensitiveParams: [],
      }
    );
    expect(cleaned.summary).toBe("plain");
    expect(cleaned.fingerprints).toEqual(["ok"]);
    expect(cleaned.livingSpecSeed).toContain("[REDACTED]");
    expect(cleaned.livingSpecSeed).not.toContain('"t"');
    expect(cleaned.livingSpecSeed).toContain("keep");
  });
});
