import {
  IsolatedRunner,
  type HotRebootResult,
  type RuntimeSnapshot,
} from "@codingland/core";

/** Demo IsolatedRunner tape: ensure / hotReboot / timeline cache. */
export class RunnerTape {
  private runner: IsolatedRunner | undefined;
  private timeline: RuntimeSnapshot[] = [];

  ensureRunner(): IsolatedRunner {
    if (!this.runner) {
      const runner = new IsolatedRunner({
        mockIo: {
          http: (req) => ({ status: 200, body: req }),
        },
      });
      runner.recordCall("fp-charge", { amount: 10 }, "call");
      runner.recordCall("fp-auth", { token: "live-token" }, "call");
      runner.recordCall("fp-exception", { err: "boom" }, "exception");
      runner.checkpoint("cp-before-exception");
      this.runner = runner;
      this.timeline = runner.snapshots();
    }
    return this.runner;
  }

  snapshots(): RuntimeSnapshot[] {
    return this.timeline;
  }

  hotReboot(): HotRebootResult {
    const result = this.ensureRunner().hotReboot();
    this.timeline = result.snapshots;
    return result;
  }
}
