jest.mock(
  "vscode",
  () => ({
    workspace: {
      getConfiguration: jest.fn(() => ({
        get: jest.fn((_key: string, def: boolean) => def),
      })),
    },
    window: {
      activeTextEditor: undefined,
    },
  }),
  { virtual: true }
);

jest.mock("./panel", () => ({
  getPanel: () => ({ appendLine: jest.fn() }),
}));

import { ProtocolEvents } from "@codingland/core";
import { GateHost, FULL_TIER_WALKTHROUGH_FINGERPRINTS } from "./gateHost";
import type { SidebarProvider } from "./sidebarProvider";

function mockSidebar(): {
  sidebar: SidebarProvider;
  postGate: jest.Mock;
  renderGateResult: jest.Mock;
} {
  const postGate = jest.fn();
  const renderGateResult = jest.fn();
  return {
    sidebar: { postGate, renderGateResult } as unknown as SidebarProvider,
    postGate,
    renderGateResult,
  };
}

describe("GateHost.trigger", () => {
  it("posts GATE_TRIGGER with light tier and local mirror when cloudOptIn is false", async () => {
    const { sidebar, postGate, renderGateResult } = mockSidebar();
    const host = new GateHost(sidebar);

    const result = await host.trigger({
      entropy: 0.4,
      coupling: 0.4,
      criticality: 0.4,
      sessionLoad: 0,
      uris: ["file:///gate.ts"],
      cloudOptIn: false,
    });

    expect(result.scoreTier).toBe("light");
    expect(postGate).toHaveBeenCalledWith({
      type: ProtocolEvents.GATE_TRIGGER,
      payload: expect.objectContaining({
        reason: "verify",
        uris: ["file:///gate.ts"],
        score: expect.objectContaining({ tier: "light" }),
        mirrorBackend: "local",
      }),
    });
    expect(renderGateResult).toHaveBeenCalledWith(result);
  });

  it("selects cloud mirrorBackend when cloudOptIn is true", async () => {
    const { sidebar, postGate } = mockSidebar();
    const host = new GateHost(sidebar);

    await host.trigger({
      entropy: 0.4,
      coupling: 0.4,
      criticality: 0.4,
      uris: ["file:///gate.ts"],
      cloudOptIn: true,
    });

    expect(postGate).toHaveBeenCalledWith({
      type: ProtocolEvents.GATE_TRIGGER,
      payload: expect.objectContaining({
        mirrorBackend: "cloud",
        score: expect.objectContaining({ tier: "light" }),
      }),
    });
  });

  it("uses named walkthrough fingerprints for full tier", async () => {
    const { sidebar, postGate } = mockSidebar();
    const host = new GateHost(sidebar);

    await host.trigger({
      entropy: 0.85,
      coupling: 0.85,
      criticality: 0.85,
      sessionLoad: 0,
      uris: ["file:///full.ts"],
      cloudOptIn: false,
      summary: "fixture path",
    });

    expect(FULL_TIER_WALKTHROUGH_FINGERPRINTS).toEqual(["fp-entry", "fp-exit"]);
    expect(postGate).toHaveBeenCalledWith({
      type: ProtocolEvents.GATE_TRIGGER,
      payload: expect.objectContaining({
        score: expect.objectContaining({ tier: "full" }),
        mirrorBackend: "local",
      }),
    });
    expect(postGate).toHaveBeenCalledWith({
      type: ProtocolEvents.GATE_WALKTHROUGH,
      payload: {
        fingerprints: FULL_TIER_WALKTHROUGH_FINGERPRINTS,
        summary: "fixture path",
      },
    });
  });
});
