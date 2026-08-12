/** ARCHITECTURE §4.2 Isolated Debug Runner — soft TTD Replay (in-process). */

import { DEFAULT_SANITIZE_OPTIONS, sanitize } from "./sanitize";

export interface RuntimeSnapshot {
  id: string;
  tMs: number;
  marker: "call" | "mutation" | "exception" | "checkpoint";
  callStackIds: string[];
  objects: Array<{
    id: string;
    typeName: string;
    fields: Record<string, string>;
  }>;
}

export interface StateInjectRequest {
  snapshotId: string;
  objectId: string;
  field: string;
  valueJson: string;
}

export interface ReplayRequest {
  entryFingerprint: string;
  inputsJson: string;
  breakFingerprint?: string;
}

export type MockIoHandler = (request: unknown) => unknown;

export interface RunnerOptions {
  mockIo?: Record<string, MockIoHandler>;
}

export interface ReplayResult {
  ok: boolean;
  stoppedAt?: string;
  snapshots: RuntimeSnapshot[];
}

export interface HotRebootResult {
  ok: boolean;
  checkpointId?: string;
  snapshots: RuntimeSnapshot[];
}

const DEFAULT_SANITIZE = DEFAULT_SANITIZE_OPTIONS;

function fieldsFromUnknown(
  fields: Record<string, unknown>
): Record<string, string> {
  const sanitized = sanitize(fields, DEFAULT_SANITIZE) as Record<
    string,
    unknown
  >;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sanitized)) {
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

export class IsolatedRunner {
  private readonly mocks: Record<string, MockIoHandler>;
  private readonly log: RuntimeSnapshot[] = [];
  private readonly tape: Array<{
    fingerprint: string;
    fields: Record<string, unknown>;
    marker: RuntimeSnapshot["marker"];
  }> = [];
  private lastCheckpointId: string | undefined;
  private tMs = 0;
  private seq = 0;

  constructor(options: RunnerOptions = {}) {
    this.mocks = { ...(options.mockIo ?? {}) };
  }

  recordCall(
    fingerprint: string,
    fields: Record<string, unknown>,
    marker: RuntimeSnapshot["marker"]
  ): RuntimeSnapshot {
    this.tape.push({ fingerprint, fields: { ...fields }, marker });
    return this.pushSnapshot(fingerprint, fields, marker);
  }

  checkpoint(id: string): RuntimeSnapshot {
    this.lastCheckpointId = id;
    this.tape.push({
      fingerprint: id,
      fields: { checkpoint: id },
      marker: "checkpoint",
    });
    return this.pushSnapshot(id, { checkpoint: id }, "checkpoint");
  }

  snapshots(): RuntimeSnapshot[] {
    return this.log.map((s) => ({
      ...s,
      objects: s.objects.map((o) => ({
        ...o,
        fields: { ...o.fields },
      })),
    }));
  }

  replay(request: ReplayRequest): ReplayResult {
    const start = this.tape.findIndex(
      (e) => e.fingerprint === request.entryFingerprint
    );
    if (start < 0) {
      return { ok: false, snapshots: [] };
    }
    // Validate sanitized inputs (ARCHITECTURE: inputsJson is sanitized)
    void sanitize(JSON.parse(request.inputsJson), DEFAULT_SANITIZE);

    const played: RuntimeSnapshot[] = [];
    for (let i = start; i < this.tape.length; i++) {
      const entry = this.tape[i];
      const snap = this.makeSnapshot(
        entry.fingerprint,
        entry.fields,
        entry.marker
      );
      played.push(snap);
      if (
        request.breakFingerprint &&
        entry.fingerprint === request.breakFingerprint
      ) {
        return {
          ok: true,
          stoppedAt: request.breakFingerprint,
          snapshots: played,
        };
      }
    }
    return {
      ok: true,
      stoppedAt: played.at(-1)?.callStackIds[0],
      snapshots: played,
    };
  }

  inject(request: StateInjectRequest): void {
    const snap = this.log.find((s) => s.id === request.snapshotId);
    if (!snap) {
      throw new Error(`unknown snapshotId: ${request.snapshotId}`);
    }
    const obj = snap.objects.find((o) => o.id === request.objectId);
    if (!obj) {
      throw new Error(`unknown objectId: ${request.objectId}`);
    }
    let value: unknown;
    try {
      value = JSON.parse(request.valueJson);
    } catch {
      value = request.valueJson;
    }
    obj.fields[request.field] =
      typeof value === "string" ? value : JSON.stringify(value);
  }

  hotReboot(): HotRebootResult {
    const checkpointId = this.lastCheckpointId;
    if (!checkpointId) {
      return { ok: false, snapshots: [] };
    }
    const idx = this.tape.findIndex(
      (e) => e.marker === "checkpoint" && e.fingerprint === checkpointId
    );
    if (idx < 0) {
      return { ok: false, checkpointId, snapshots: [] };
    }
    this.log.length = 0;
    this.tMs = 0;
    this.seq = 0;
    const played: RuntimeSnapshot[] = [];
    for (let i = 0; i <= idx; i++) {
      const entry = this.tape[i];
      played.push(
        this.pushSnapshot(entry.fingerprint, entry.fields, entry.marker)
      );
    }
    return { ok: true, checkpointId, snapshots: played };
  }

  mockIo(channel: string, request: unknown): unknown {
    const handler = this.mocks[channel];
    if (!handler) {
      throw new Error(`no mock for channel: ${channel}`);
    }
    return handler(request);
  }

  private pushSnapshot(
    fingerprint: string,
    fields: Record<string, unknown>,
    marker: RuntimeSnapshot["marker"]
  ): RuntimeSnapshot {
    const snap = this.makeSnapshot(fingerprint, fields, marker);
    this.log.push(snap);
    return snap;
  }

  private makeSnapshot(
    fingerprint: string,
    fields: Record<string, unknown>,
    marker: RuntimeSnapshot["marker"]
  ): RuntimeSnapshot {
    this.tMs += 1;
    this.seq += 1;
    const id = `snap-${this.seq}`;
    return {
      id,
      tMs: this.tMs,
      marker,
      callStackIds: [fingerprint],
      objects: [
        {
          id: `obj-${this.seq}`,
          typeName: "Frame",
          fields: fieldsFromUnknown(fields),
        },
      ],
    };
  }
}
