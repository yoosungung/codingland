import {
  ProtocolEvents,
  isProtocolEvent,
  parseEnvelope,
} from "./events";

describe("protocol", () => {
  it("exposes ARCHITECTURE §5 event names", () => {
    expect(ProtocolEvents.GRAPH_DELTA).toBe("graph.delta");
    expect(ProtocolEvents.EDITOR_REVEAL_BESIDE).toBe("editor.revealBeside");
    expect(ProtocolEvents.RUNNER_HOT_REBOOT).toBe("runner.hotReboot");
  });

  it("isProtocolEvent accepts known types only", () => {
    expect(isProtocolEvent("graph.delta")).toBe(true);
    expect(isProtocolEvent("not.a.real.event")).toBe(false);
  });

  it("parseEnvelope returns typed envelope for valid messages", () => {
    const env = parseEnvelope({
      type: "graph.delta",
      payload: { upsertNodes: [] },
    });
    expect(env).toEqual({
      type: "graph.delta",
      payload: { upsertNodes: [] },
    });
  });

  it("parseEnvelope returns null for invalid shapes", () => {
    expect(parseEnvelope(null)).toBeNull();
    expect(parseEnvelope({ type: "graph.delta" })).toBeNull();
    expect(parseEnvelope({ type: "nope", payload: {} })).toBeNull();
    expect(parseEnvelope("graph.delta")).toBeNull();
  });
});
