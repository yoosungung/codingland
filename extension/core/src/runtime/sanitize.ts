/** ARCHITECTURE §4.5 Sanitizer — shallow redact for Runner / Mirror inputs. */

export interface SanitizeOptions {
  maxDepth: 3;
  namePatterns: string[];
  astSensitiveParams: string[];
}

const REDACTED = "[REDACTED]";
const MAX_DEPTH = "[MAX_DEPTH]";

function isSensitiveKey(key: string, options: SanitizeOptions): boolean {
  const lower = key.toLowerCase();
  for (const p of options.namePatterns) {
    if (lower.includes(p.toLowerCase())) {
      return true;
    }
  }
  for (const p of options.astSensitiveParams) {
    if (lower === p.toLowerCase()) {
      return true;
    }
  }
  return false;
}

function stringifyLeaf(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

/**
 * Sanitize a JSON-like value: redact sensitive keys, cap depth, stringify leaves.
 */
export function sanitize(value: unknown, options: SanitizeOptions): unknown {
  return walk(value, options, 0);
}

function walk(
  value: unknown,
  options: SanitizeOptions,
  depth: number
): unknown {
  if (depth >= options.maxDepth) {
    return MAX_DEPTH;
  }
  if (value === null || typeof value !== "object") {
    return stringifyLeaf(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => walk(item, options, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(key, options)) {
      out[key] = REDACTED;
      continue;
    }
    out[key] = walk(child, options, depth + 1);
  }
  return out;
}
