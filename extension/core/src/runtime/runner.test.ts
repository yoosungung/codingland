import {
  IsolatedRunner,
  type MockIoHandler,
  type ReplayRequest,
  type StateInjectRequest,
} from "./runner";

describe("IsolatedRunner", () => {
  const entry = "fp-charge";
  const breakFp = "fp-exception";

  function buildRunner(mocks?: Record<string, MockIoHandler>): IsolatedRunner {
    const runner = new IsolatedRunner({ mockIo: mocks ?? {} });
    runner.recordCall(entry, { amount: 10 }, "call");
    runner.recordCall("fp-auth", { token: "live-token" }, "call");
    runner.recordCall(breakFp, { err: "boom" }, "exception");
    runner.checkpoint("cp-before-exception");
    return runner;
  }

  it("replays sanitized inputs to a break fingerprint", () => {
    const runner = buildRunner();
    const req: ReplayRequest = {
      entryFingerprint: entry,
      inputsJson: JSON.stringify({ amount: 10 }),
      breakFingerprint: breakFp,
    };
    const result = runner.replay(req);
    expect(result.ok).toBe(true);
    expect(result.stoppedAt).toBe(breakFp);
    expect(result.snapshots.map((s) => s.marker)).toEqual([
      "call",
      "call",
      "exception",
    ]);
  });

  it("injects a field into a snapshot object before continuing", () => {
    const runner = buildRunner();
    const snap = runner.snapshots()[1];
    const inject: StateInjectRequest = {
      snapshotId: snap.id,
      objectId: snap.objects[0].id,
      field: "token",
      valueJson: JSON.stringify("injected-token"),
    };
    runner.inject(inject);
    const after = runner.snapshots().find((s) => s.id === snap.id)!;
    expect(after.objects[0].fields.token).toBe("injected-token");
  });

  it("hotReboot restarts and fast-replays to last checkpoint", () => {
    const runner = buildRunner();
    const before = runner.snapshots().length;
    const result = runner.hotReboot();
    expect(result.ok).toBe(true);
    expect(result.checkpointId).toBe("cp-before-exception");
    expect(result.snapshots.length).toBeGreaterThan(0);
    expect(result.snapshots.length).toBeLessThanOrEqual(before);
    expect(result.snapshots.at(-1)?.marker).toBe("checkpoint");
  });

  it("routes Mock I/O through registered handlers (no live IO)", () => {
    let hits = 0;
    const runner = buildRunner({
      http: (req) => {
        hits += 1;
        return { status: 200, body: req };
      },
    });
    const res = runner.mockIo("http", { url: "/pay" });
    expect(hits).toBe(1);
    expect(res).toEqual({ status: 200, body: { url: "/pay" } });
    expect(() => runner.mockIo("db", {})).toThrow(/no mock/i);
  });
});
