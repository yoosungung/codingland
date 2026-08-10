import type { ChangeScore } from "./changeScore";

/** ARCHITECTURE §4.3 / §7 Gate session phases. */

export type GatePhase =
  | "explore"
  | "walkthrough"
  | "teachback"
  | "mirror"
  | "passed"
  | "bypassed";

export type TeachBackModality =
  | { kind: "text"; text: string }
  | { kind: "spatial"; orderedNodeIds: string[] }
  | { kind: "quiz"; answers: string[] }
  | { kind: "diagnostic"; finding: string };

export interface TeachBackSubmission {
  modality: TeachBackModality;
  nodeFingerprints: string[];
  /** Telemetry only — never triggers Bypass. */
  attempt: number;
}

export interface MirrorDraft {
  livingSpecMarkdown: string;
  soloAdvisory?: 1 | 2 | 3 | 4 | 5;
  questions: string[];
  hintNodeIds?: string[];
}

export interface ConsensusResult {
  accepted: boolean;
  draft: MirrorDraft;
}

export interface BypassRecord {
  fingerprints: string[];
  uris: string[];
  at: string;
  reason: string;
  tier: ChangeScore["tier"];
  score: ChangeScore;
}

export interface WalkthroughPayload {
  fingerprints: string[];
  summary: string;
  pathNodeIds: string[];
}

export interface GateTrigger {
  reason: "commit" | "test" | "verify";
  uris: string[];
  score: ChangeScore;
  walkthrough?: WalkthroughPayload;
}

export type PreferredModality = TeachBackModality["kind"];

export interface GateSession {
  reason: GateTrigger["reason"];
  uris: string[];
  score: ChangeScore;
  phase: GatePhase;
  passed: boolean;
  walkthrough?: WalkthroughPayload;
  preferredModality: PreferredModality;
  hintNodeIds: string[];
  lastAttempt: number;
}

const LIGHTER: PreferredModality[] = ["text", "spatial", "quiz", "diagnostic"];

function nextLighter(current: PreferredModality): PreferredModality {
  const i = LIGHTER.indexOf(current);
  if (i < 0 || i >= LIGHTER.length - 1) {
    return "diagnostic";
  }
  return LIGHTER[i + 1]!;
}

export function openGate(trigger: GateTrigger): GateSession {
  const base: GateSession = {
    reason: trigger.reason,
    uris: trigger.uris,
    score: trigger.score,
    phase: "explore",
    passed: false,
    walkthrough: trigger.walkthrough,
    preferredModality:
      trigger.score.sessionLoad >= 0.5 ? "spatial" : "text",
    hintNodeIds: [],
    lastAttempt: 0,
  };

  switch (trigger.score.tier) {
    case "none":
      return { ...base, phase: "explore", passed: true };
    case "light":
      return { ...base, phase: "mirror", passed: false };
    case "full":
      return { ...base, phase: "walkthrough", passed: false };
  }
}

export function applyTeachBack(
  session: GateSession,
  submission: TeachBackSubmission
): GateSession {
  if (session.phase !== "walkthrough" && session.phase !== "teachback") {
    return session;
  }
  return {
    ...session,
    phase: "mirror",
    lastAttempt: submission.attempt,
    preferredModality: submission.modality.kind,
  };
}

export function applyConsensus(
  session: GateSession,
  result: ConsensusResult
): GateSession {
  if (session.phase !== "mirror") {
    return session;
  }
  if (!result.accepted) {
    return session;
  }
  return { ...session, phase: "passed", passed: true };
}

export function rejectDraft(
  session: GateSession,
  opts: { hintNodeIds: string[] }
): GateSession {
  if (session.phase !== "mirror") {
    return session;
  }
  return {
    ...session,
    phase: "teachback",
    passed: false,
    hintNodeIds: opts.hintNodeIds,
    preferredModality: nextLighter(session.preferredModality),
  };
}

export function requestBypass(
  session: GateSession,
  opts: { reason: string; at?: string }
): { ok: boolean; session: GateSession; record?: BypassRecord } {
  if (!session.score.bypassAllowed) {
    return { ok: false, session };
  }
  if (session.phase === "passed" || session.phase === "explore") {
    return { ok: false, session };
  }
  const record: BypassRecord = {
    fingerprints: session.walkthrough?.fingerprints ?? [],
    uris: session.uris,
    at: opts.at ?? new Date(0).toISOString(),
    reason: opts.reason,
    tier: session.score.tier,
    score: session.score,
  };
  return {
    ok: true,
    session: { ...session, phase: "bypassed", passed: false },
    record,
  };
}
