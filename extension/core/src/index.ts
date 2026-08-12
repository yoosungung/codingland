export type {
  EdgeConfidence,
  GraphDelta,
  GraphEdge,
  GraphNode,
  GraphPathQuery,
  GraphPathResult,
  GraphSnapshot,
  NodeKind,
  VerifyState,
  ZoomLevel,
} from "./graph/types";

export { applyGraphDelta } from "./graph/delta";
export { fingerprintAst, type FingerprintInput } from "./graph/fingerprint";
export {
  defaultConfidence,
  isExtracted,
} from "./graph/edgeConfidence";
export { aggregateDebt, type DebtCounts } from "./graph/debt";
export {
  applySemanticZoom,
  ensureAnchors,
  preserveAnchors,
} from "./graph/layout";
export {
  extractGraphFromSource,
  type ExtractInput,
} from "./ast/extract";
export {
  PAYMENT_MIDDLEWARE_FILE,
  PAYMENT_MIDDLEWARE_SOURCE,
} from "./ast/paymentSample";
export {
  sanitize,
  DEFAULT_SANITIZE_OPTIONS,
  type SanitizeOptions,
} from "./runtime/sanitize";
export {
  IsolatedRunner,
  type HotRebootResult,
  type MockIoHandler,
  type ReplayRequest,
  type ReplayResult,
  type RunnerOptions,
  type RuntimeSnapshot,
  type StateInjectRequest,
} from "./runtime/runner";
export {
  linkJestStub,
  parseLivingSpec,
  type LivingSpecArtifact,
} from "./spec/livingSpec";
export {
  BYPASS_COMMIT_TAG,
  formatBypassCommitMessage,
  syncLivingSpec,
  type SpecSyncOp,
  type SpecSyncResult,
} from "./spec/specSync";
export {
  ProtocolEvents,
  isProtocolEvent,
  parseEnvelope,
  type ProtocolEventType,
  type ProtocolEnvelope,
} from "./protocol/events";
export {
  computeChangeScore,
  type ChangeScore,
  type ChangeScoreInput,
  type FrictionTier,
} from "./gate/changeScore";
export {
  applyConsensus,
  applyTeachBack,
  openGate,
  rejectDraft,
  requestBypass,
  type BypassRecord,
  type ConsensusResult,
  type GatePhase,
  type GateSession,
  type GateTrigger,
  type MirrorDraft,
  type PreferredModality,
  type TeachBackModality,
  type TeachBackSubmission,
  type WalkthroughPayload,
} from "./gate/session";
export {
  HeuristicMirrorAdapter,
  buildHeuristicMirrorDraft,
  draftMirrorForScore,
  type MirrorAdapter,
  type MirrorDraftRequest,
} from "./gate/mirrorAdapter";
export {
  CloudMirrorAdapter,
  resolveMirrorAdapter,
  sanitizeMirrorRequest,
  type MirrorBackendKind,
  type ResolveMirrorAdapterOptions,
  type ResolvedMirrorAdapter,
} from "./gate/cloudMirror";
export {
  runGateSmoke,
  type GateSmokeRequest,
  type GateSmokeResult,
} from "./gate/gateSmoke";
export {
  queryGraphPath,
  type PathQueryOptions,
} from "./graph/pathQuery";
