import { createHash } from "crypto";

export interface FingerprintInput {
  kind: string;
  name: string;
  uri: string;
  range: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
  /** Optional param names — Living Spec / Sanitizer key material */
  params?: string[];
}

/**
 * Deterministic AST-signature fingerprint (ARCHITECTURE §1.10 / §4.1).
 * M0: hash of structural fields only (no real AST yet).
 */
export function fingerprintAst(input: FingerprintInput): string {
  const payload = JSON.stringify({
    kind: input.kind,
    name: input.name,
    uri: input.uri,
    range: input.range,
    params: input.params ?? [],
  });
  return sha256Hex(payload, 16);
}

/** Exposed for tests that want the same digest algorithm. */
export function sha256Hex(payload: string, length = 16): string {
  return createHash("sha256").update(payload).digest("hex").slice(0, length);
}
