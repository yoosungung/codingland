/** Host↔Webview / Runner event names — ARCHITECTURE §5. */

export const ProtocolEvents = {
  GRAPH_FULL: "graph.full",
  GRAPH_DELTA: "graph.delta",
  GRAPH_SELECT: "graph.select",
  GRAPH_PATH_QUERY: "graph.path.query",
  GRAPH_PATH_RESULT: "graph.path.result",
  EDITOR_REVEAL_BESIDE: "editor.revealBeside",
  TIMELINE_CACHE: "timeline.cache",
  TIMELINE_ON_CHANGE_END: "timeline.onChangeEnd",
  INJECT_REQUEST: "inject.request",
  REPLAY_REQUEST: "replay.request",
  RUNNER_HOT_REBOOT: "runner.hotReboot",
  DEBT_UPDATED: "debt.updated",
  GATE_TRIGGER: "gate.trigger",
  GATE_WALKTHROUGH: "gate.walkthrough",
  GATE_TEACHBACK: "gate.teachback",
  GATE_MIRROR: "gate.mirror",
  GATE_CONSENSUS: "gate.consensus",
  GATE_BYPASS: "gate.bypass",
  SPEC_WRITTEN: "spec.written",
  TEST_GENERATED: "test.generated",
} as const;

export type ProtocolEventType =
  (typeof ProtocolEvents)[keyof typeof ProtocolEvents];

export interface ProtocolEnvelope {
  type: ProtocolEventType;
  payload: unknown;
}

const EVENT_SET = new Set<string>(Object.values(ProtocolEvents));

export function isProtocolEvent(type: string): type is ProtocolEventType {
  return EVENT_SET.has(type);
}

/**
 * Parse a raw message into a typed envelope.
 * Returns null if shape/type is invalid (never throws).
 */
export function parseEnvelope(raw: unknown): ProtocolEnvelope | null {
  if (raw === null || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.type !== "string" || !isProtocolEvent(obj.type)) {
    return null;
  }
  if (!("payload" in obj)) {
    return null;
  }
  return { type: obj.type, payload: obj.payload };
}
