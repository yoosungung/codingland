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

function clamp01(n: number): number {
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.min(1, Math.max(0, n));
}

/** M3 experimental defaults — see extension/DESIGN.md. */
function sessionLoadPenalty(sessionLoad: number): number {
  if (sessionLoad >= 0.7) {
    return 0.25;
  }
  if (sessionLoad >= 0.4) {
    return 0.1;
  }
  return 0;
}

function tierFromSeverity(severity: number): FrictionTier {
  if (severity < 0.3) {
    return "none";
  }
  if (severity < 0.6) {
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
  const bypassAllowed = criticality < 0.7 || sessionLoad >= 0.5;

  return {
    entropy,
    coupling,
    criticality,
    sessionLoad,
    tier,
    bypassAllowed,
  };
}
