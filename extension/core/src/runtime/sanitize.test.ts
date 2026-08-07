import { sanitize, type SanitizeOptions } from "./sanitize";

describe("sanitize", () => {
  const opts: SanitizeOptions = {
    maxDepth: 3,
    namePatterns: ["password", "token", "secret"],
    astSensitiveParams: ["apiKey"],
  };

  it("redacts fields matching namePatterns (case-insensitive)", () => {
    const out = sanitize(
      { user: "a", password: "hunter2", nested: { token: "t" } },
      opts
    ) as Record<string, unknown>;
    expect(out.user).toBe("a");
    expect(out.password).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).token).toBe("[REDACTED]");
  });

  it("redacts astSensitiveParams", () => {
    const out = sanitize({ apiKey: "k", ok: 1 }, opts) as Record<
      string,
      unknown
    >;
    expect(out.apiKey).toBe("[REDACTED]");
    expect(out.ok).toBe("1");
  });

  it("caps depth at maxDepth (depth 3 keeps leaves; deeper becomes [MAX_DEPTH])", () => {
    const deep = { a: { b: { c: { d: "too-deep" } } } };
    const out = sanitize(deep, opts) as {
      a: { b: { c: unknown } };
    };
    expect(out.a.b.c).toBe("[MAX_DEPTH]");
  });

  it("stringifies primitives for RuntimeSnapshot fields", () => {
    const out = sanitize({ n: 42, b: true, s: "x" }, opts) as Record<
      string,
      unknown
    >;
    expect(out.n).toBe("42");
    expect(out.b).toBe("true");
    expect(out.s).toBe("x");
  });
});
