/** ARCHITECTURE §4.3 Gate / Mirror — ChangeScore. */

export type FrictionTier = "none" | "light" | "full";

export interface ChangeScoreInput {
  entropy: number;
  coupling: number;
  criticality: number;
  sessionLoad: number;
}

export interface ChangeScore {
  entropy: number;
  coupling: number;
  criticality: number;
  sessionLoad: number;
  tier: FrictionTier;
  bypassAllowed: boolean;
}

/** M3 experimental defaults — see extension/DESIGN.md (ROADMAP 미결정). */
export const SESSION_LOAD_PENALTY_HIGH = 0.25;
export const SESSION_LOAD_PENALTY_MID = 0.15;
export const SESSION_LOAD_THRESHOLD_HIGH = 0.7;
export const SESSION_LOAD_THRESHOLD_MID = 0.4;
export const TIER_THRESHOLD_NONE = 0.3;
export const TIER_THRESHOLD_LIGHT = 0.6;
export const BYPASS_CRITICALITY_MAX = 0.7;
export const BYPASS_SESSION_LOAD_MIN = 0.5;

function clamp01(n: number): number {
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.min(1, Math.max(0, n));
}

function sessionLoadPenalty(sessionLoad: number): number {
  if (sessionLoad >= SESSION_LOAD_THRESHOLD_HIGH) {
    return SESSION_LOAD_PENALTY_HIGH;
  }
  if (sessionLoad >= SESSION_LOAD_THRESHOLD_MID) {
    return SESSION_LOAD_PENALTY_MID;
  }
  return 0;
}

function tierFromSeverity(severity: number): FrictionTier {
  if (severity < TIER_THRESHOLD_NONE) {
    return "none";
  }
  if (severity < TIER_THRESHOLD_LIGHT) {
    return "light";
  }
  return "full";
}

/**
 * Pure ChangeScore — no apply lock / side effects (ARCHITECTURE §1.6).
 * High sessionLoad downshifts tier. bypassAllowed is score policy, not attempt count.
 */
export function computeChangeScore(input: ChangeScoreInput): ChangeScore {
  const entropy = clamp01(input.entropy);
  const coupling = clamp01(input.coupling);
  const criticality = clamp01(input.criticality);
  const sessionLoad = clamp01(input.sessionLoad);

  const severity =
    (entropy + coupling + criticality) / 3 - sessionLoadPenalty(sessionLoad);
  const tier = tierFromSeverity(severity);
  const bypassAllowed =
    criticality < BYPASS_CRITICALITY_MAX ||
    sessionLoad >= BYPASS_SESSION_LOAD_MIN;

  return {
    entropy,
    coupling,
    criticality,
    sessionLoad,
    tier,
    bypassAllowed,
  };
}
