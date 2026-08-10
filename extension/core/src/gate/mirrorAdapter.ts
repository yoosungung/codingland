import { computeChangeScore, type ChangeScore } from "./changeScore";
import type { MirrorDraft } from "./session";

/** Request for Mirror draft — ARCHITECTURE §4.3 (SOLO advisory only). */
export interface MirrorDraftRequest {
  score: ChangeScore;
  fingerprints: string[];
  summary?: string;
  livingSpecSeed?: string;
}

/**
 * Local Mirror backend. Ollama vs node-llama still undecided (ROADMAP) —
 * default host wiring uses HeuristicMirrorAdapter until a runtime is chosen.
 */
export interface MirrorAdapter {
  draft(request: MirrorDraftRequest): Promise<MirrorDraft>;
}

function soloFromScore(score: ChangeScore): 1 | 2 | 3 | 4 | 5 {
  const severity =
    (score.entropy + score.coupling + score.criticality) / 3;
  if (severity < 0.2) {
    return 1;
  }
  if (severity < 0.4) {
    return 2;
  }
  if (severity < 0.6) {
    return 3;
  }
  if (severity < 0.8) {
    return 4;
  }
  return 5;
}

/** Pure heuristic draft — no network / no Pass authority. */
export function buildHeuristicMirrorDraft(
  request: MirrorDraftRequest
): MirrorDraft {
  const fps = request.fingerprints;
  const summary = request.summary?.trim() || "change under review";
  const seed = request.livingSpecSeed?.trim();
  const livingSpecMarkdown =
    seed && seed.length > 0
      ? seed
      : [
          `# Living Spec draft`,
          ``,
          `## Summary`,
          summary,
          ``,
          `## Fingerprints`,
          ...fps.map((fp) => `- ${fp}`),
          ``,
          `## ChangeScore`,
          `- tier: ${request.score.tier}`,
          `- sessionLoad: ${request.score.sessionLoad}`,
        ].join("\n");

  return {
    livingSpecMarkdown,
    soloAdvisory: soloFromScore(request.score),
    questions: [
      "What invariant does this change preserve?",
      "Which extracted edges are affected?",
      request.score.sessionLoad >= 0.5
        ? "Can you show the path spatially instead of prose?"
        : "Explain the failure mode if this change is wrong.",
    ],
    hintNodeIds: fps.slice(0, 3),
  };
}

export class HeuristicMirrorAdapter implements MirrorAdapter {
  async draft(request: MirrorDraftRequest): Promise<MirrorDraft> {
    return buildHeuristicMirrorDraft(request);
  }
}

/** Convenience: score inputs → heuristic draft (host smoke). */
export async function draftMirrorForScore(
  input: {
    entropy: number;
    coupling: number;
    criticality: number;
    sessionLoad: number;
  },
  fingerprints: string[],
  summary?: string,
  adapter: MirrorAdapter = new HeuristicMirrorAdapter()
): Promise<{ score: ChangeScore; draft: MirrorDraft }> {
  const score = computeChangeScore(input);
  const draft = await adapter.draft({ score, fingerprints, summary });
  return { score, draft };
}
