import * as vscode from "vscode";
import {
  ProtocolEvents,
  computeChangeScore,
  runGateSmoke,
  type ChangeScoreInput,
  type GateSmokeResult,
} from "@codingland/core";
import { getPanel } from "./panel";
import type { SidebarProvider } from "./sidebarProvider";

export interface TriggerGateArgs extends Partial<ChangeScoreInput> {
  uris?: string[];
  accept?: boolean;
  summary?: string;
}

/**
 * Host Gate adapter — command-driven (SCM/husky undecided; default: command).
 * Posts gate.* protocol events to Sidebar and logs tiers to Panel.
 */
export class GateHost {
  constructor(private readonly sidebar: SidebarProvider) {}

  async trigger(args: TriggerGateArgs = {}): Promise<GateSmokeResult> {
    const scoreInput: ChangeScoreInput = {
      entropy: args.entropy ?? 0.4,
      coupling: args.coupling ?? 0.4,
      criticality: args.criticality ?? 0.4,
      sessionLoad: args.sessionLoad ?? 0,
    };
    const score = computeChangeScore(scoreInput);
    const uris =
      args.uris ??
      vscode.window.activeTextEditor?.document.uri.toString() ??
      "untitled:gate";
    const uriList = Array.isArray(uris) ? uris : [uris];

    const panel = getPanel();
    panel.appendLine(
      `[gate.trigger] tier=${score.tier} sessionLoad=${score.sessionLoad} bypassAllowed=${score.bypassAllowed}`
    );

    this.sidebar.postGate({
      type: ProtocolEvents.GATE_TRIGGER,
      payload: { reason: "verify", uris: uriList, score },
    });

    const result = await runGateSmoke({
      scoreInput,
      uris: uriList,
      reason: "verify",
      accept: args.accept !== false,
      walkthrough:
        score.tier === "full"
          ? {
              fingerprints: ["fp-entry", "fp-exit"],
              summary: args.summary ?? "in-process path hint",
              pathNodeIds: ["entry", "exit"],
            }
          : undefined,
    });

    if (result.session.phase === "walkthrough" || score.tier === "full") {
      this.sidebar.postGate({
        type: ProtocolEvents.GATE_WALKTHROUGH,
        payload: {
          fingerprints: ["fp-entry", "fp-exit"],
          summary: args.summary ?? "in-process path hint",
        },
      });
    }

    if (result.draftMarkdown) {
      this.sidebar.postGate({
        type: ProtocolEvents.GATE_MIRROR,
        payload: {
          livingSpecMarkdown: result.draftMarkdown,
          questions: [],
        },
      });
    }

    if (result.passed) {
      this.sidebar.postGate({
        type: ProtocolEvents.GATE_CONSENSUS,
        payload: { accepted: true },
      });
    }

    panel.appendLine(
      `[gate.result] scoreTier=${result.scoreTier} phase=${result.session.phase} passed=${result.passed}`
    );
    this.sidebar.renderGateResult(result);
    return result;
  }
}
