import { computeChangeScore, type ChangeScoreInput } from "./changeScore";
import {
  HeuristicMirrorAdapter,
  type MirrorAdapter,
} from "./mirrorAdapter";
import {
  applyConsensus,
  applyTeachBack,
  openGate,
  type GateSession,
  type WalkthroughPayload,
} from "./session";

export interface GateSmokeRequest {
  scoreInput: ChangeScoreInput;
  uris: string[];
  reason?: "commit" | "test" | "verify";
  walkthrough?: WalkthroughPayload;
  accept?: boolean;
  adapter?: MirrorAdapter;
}

export interface GateSmokeResult {
  scoreTier: ReturnType<typeof computeChangeScore>["tier"];
  session: GateSession;
  passed: boolean;
  draftMarkdown?: string;
}

/**
 * Host-facing smoke path: ChangeScore → GateSession → Mirror draft → optional consensus.
 * Covers none/light/full without VS Code runtime (ARCHITECTURE §7).
 */
export async function runGateSmoke(
  req: GateSmokeRequest
): Promise<GateSmokeResult> {
  const score = computeChangeScore(req.scoreInput);
  const adapter = req.adapter ?? new HeuristicMirrorAdapter();
  let session = openGate({
    reason: req.reason ?? "verify",
    uris: req.uris,
    score,
    walkthrough: req.walkthrough,
  });

  if (session.phase === "explore" && session.passed) {
    return { scoreTier: score.tier, session, passed: true };
  }

  if (session.phase === "walkthrough") {
    session = applyTeachBack(session, {
      modality:
        score.sessionLoad >= 0.5
          ? {
              kind: "spatial",
              orderedNodeIds: req.walkthrough?.pathNodeIds ?? [],
            }
          : { kind: "text", text: "teach-back" },
      nodeFingerprints: req.walkthrough?.fingerprints ?? [],
      attempt: 1,
    });
  }

  const draft = await adapter.draft({
    score,
    fingerprints: req.walkthrough?.fingerprints ?? [],
    summary: req.walkthrough?.summary,
  });

  if (session.phase === "mirror" && req.accept !== false) {
    session = applyConsensus(session, { accepted: true, draft });
  }

  return {
    scoreTier: score.tier,
    session,
    passed: session.passed,
    draftMarkdown: draft.livingSpecMarkdown,
  };
}
