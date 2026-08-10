import type { LivingSpecArtifact } from "./livingSpec";

/** ARCHITECTURE §1.9 / §1.10 — SpecSync + Bypass PR/commit tag. */

export const BYPASS_COMMIT_TAG = "[Bypassed Epistemic Debt]";

export type SpecSyncOp =
  | {
      kind: "rename";
      fromFingerprint: string;
      toFingerprint: string;
      nextPath?: string;
    }
  | { kind: "delete"; fingerprint: string };

export interface SpecSyncResult extends LivingSpecArtifact {
  changed: boolean;
  deleted: boolean;
}

/**
 * Sync Living Spec sidecar fingerprint mapping on rename/delete.
 * Pure — host applies filesystem moves separately.
 */
export function syncLivingSpec(
  artifact: LivingSpecArtifact,
  op: SpecSyncOp
): SpecSyncResult {
  if (op.kind === "rename") {
    if (!artifact.fingerprints.includes(op.fromFingerprint)) {
      return { ...artifact, changed: false, deleted: false };
    }
    const fingerprints = artifact.fingerprints.map((fp) =>
      fp === op.fromFingerprint ? op.toFingerprint : fp
    );
    return {
      ...artifact,
      fingerprints,
      path: op.nextPath ?? artifact.path,
      changed: true,
      deleted: false,
    };
  }

  const fingerprints = artifact.fingerprints.filter(
    (fp) => fp !== op.fingerprint
  );
  const changed = fingerprints.length !== artifact.fingerprints.length;
  return {
    ...artifact,
    fingerprints,
    changed,
    deleted: changed && fingerprints.length === 0,
  };
}

export function formatBypassCommitMessage(subject: string): string {
  const trimmed = subject.trim();
  if (trimmed.includes(BYPASS_COMMIT_TAG)) {
    return trimmed;
  }
  return `${trimmed} ${BYPASS_COMMIT_TAG}`;
}
