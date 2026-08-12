import {
  sanitize,
  DEFAULT_SANITIZE_OPTIONS,
  type SanitizeOptions,
} from "../runtime/sanitize";
import {
  HeuristicMirrorAdapter,
  buildHeuristicMirrorDraft,
  type MirrorAdapter,
  type MirrorDraftRequest,
} from "./mirrorAdapter";
import type { MirrorDraft } from "./session";

/** Backend kind selected for Mirror draft generation (ARCHITECTURE §1.8). */
export type MirrorBackendKind = "local" | "cloud";

export interface ResolveMirrorAdapterOptions {
  /** Default false — cloud Mirror is opt-in only. */
  cloudOptIn?: boolean;
  sanitizeOptions?: SanitizeOptions;
  /** Optional local override (tests / host injection). */
  localAdapter?: MirrorAdapter;
  /** Optional cloud override (tests / host injection). */
  cloudAdapter?: MirrorAdapter;
}

export interface ResolvedMirrorAdapter {
  kind: MirrorBackendKind;
  adapter: MirrorAdapter;
}

/**
 * Resolve Mirror backend: local Heuristic by default; Cloud only when cloudOptIn.
 * Does not choose Ollama vs node-llama (ROADMAP undecided).
 */
export function resolveMirrorAdapter(
  opts: ResolveMirrorAdapterOptions = {}
): ResolvedMirrorAdapter {
  const cloudOptIn = opts.cloudOptIn === true;
  if (cloudOptIn) {
    return {
      kind: "cloud",
      adapter:
        opts.cloudAdapter ??
        new CloudMirrorAdapter(
          opts.sanitizeOptions ?? DEFAULT_SANITIZE_OPTIONS
        ),
    };
  }
  return {
    kind: "local",
    adapter: opts.localAdapter ?? new HeuristicMirrorAdapter(),
  };
}

/**
 * Cloud Mirror path (opt-in). Sanitizes egress bag before drafting.
 * Stub: no network — real HTTP/API keys are out of M3.1 scope (DESIGN).
 */
export class CloudMirrorAdapter implements MirrorAdapter {
  constructor(
    private readonly sanitizeOptions: SanitizeOptions = DEFAULT_SANITIZE_OPTIONS
  ) {}

  async draft(request: MirrorDraftRequest): Promise<MirrorDraft> {
    const sanitized = sanitizeMirrorRequest(request, this.sanitizeOptions);
    const draft = buildHeuristicMirrorDraft(sanitized);
    return {
      ...draft,
      livingSpecMarkdown: [
        `<!-- mirror-backend: cloud-opt-in -->`,
        draft.livingSpecMarkdown,
      ].join("\n"),
      questions: [
        ...draft.questions,
        "(cloud opt-in) Confirm no secrets remain in the Living Spec draft.",
      ],
    };
  }
}

/**
 * Build + sanitize the cloud egress bag (ARCHITECTURE §4.5 / §1.8).
 * JSON `livingSpecSeed` is parsed so name/AST keys redact before re-stringifying.
 */
export function sanitizeMirrorRequest(
  request: MirrorDraftRequest,
  options: SanitizeOptions = DEFAULT_SANITIZE_OPTIONS
): MirrorDraftRequest {
  const bag: Record<string, unknown> = {
    summary: request.summary ?? "",
    fingerprints: request.fingerprints,
  };
  const seed = request.livingSpecSeed?.trim() ?? "";
  if (seed.startsWith("{") || seed.startsWith("[")) {
    try {
      bag.livingSpec = JSON.parse(seed);
    } catch {
      bag.livingSpecSeed = seed;
    }
  } else {
    bag.livingSpecSeed = seed;
  }

  const cleaned = sanitize(bag, options) as Record<string, unknown>;
  const fingerprints = Array.isArray(cleaned.fingerprints)
    ? cleaned.fingerprints.map((fp) =>
        typeof fp === "string" ? fp : String(fp)
      )
    : [];

  let livingSpecSeed = "";
  if ("livingSpec" in cleaned) {
    livingSpecSeed =
      typeof cleaned.livingSpec === "string"
        ? cleaned.livingSpec
        : JSON.stringify(cleaned.livingSpec);
  } else if (cleaned.livingSpecSeed !== undefined) {
    livingSpecSeed =
      typeof cleaned.livingSpecSeed === "string"
        ? cleaned.livingSpecSeed
        : String(cleaned.livingSpecSeed);
  }

  return {
    score: request.score,
    fingerprints,
    summary:
      typeof cleaned.summary === "string"
        ? cleaned.summary
        : String(cleaned.summary ?? ""),
    livingSpecSeed,
  };
}
