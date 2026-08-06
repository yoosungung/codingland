import type { EdgeConfidence } from "./types";

/** ARCHITECTURE §4.1 — missing confidence means extracted. */
export function defaultConfidence(
  confidence?: EdgeConfidence
): EdgeConfidence {
  return confidence ?? "extracted";
}

export function isExtracted(confidence?: EdgeConfidence): boolean {
  return defaultConfidence(confidence) === "extracted";
}
