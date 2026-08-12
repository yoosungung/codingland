import {
  DEFAULT_SANITIZE_OPTIONS,
  sanitize,
  type SanitizeOptions,
} from "./sanitize";

describe("sanitize", () => {
  const opts: SanitizeOptions = {
    maxDepth: 3,
    namePatterns: ["password", "token", "secret"],
    astSensitiveParams: ["apiKey"],
  };

  it("redacts fields matching namePatterns (case-insensitive)", () => {
    const out = sanitize(
      { user: "a", Password: "hunter2", nested: { TOKEN: "t" } },
      opts
    ) as Record<string, unknown>;
    expect(out.user).toBe("a");
    expect(out.Password).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).TOKEN).toBe("[REDACTED]");
  });

  it("redacts namePatterns as substrings (e.g. userPassword)", () => {
    const out = sanitize({ userPassword: "x", ok: "y" }, opts) as Record<
      string,
      unknown
    >;
    expect(out.userPassword).toBe("[REDACTED]");
    expect(out.ok).toBe("y");
  });

  it("redacts astSensitiveParams", () => {
    const out = sanitize({ apiKey: "k", ok: 1 }, opts) as Record<
      string,
      unknown
    >;
    expect(out.apiKey).toBe("[REDACTED]");
    expect(out.ok).toBe("1");
  });

  it("matches astSensitiveParams by exact key only (not substring)", () => {
    const out = sanitize({ myApiKey: "leak", apiKey: "k" }, opts) as Record<
      string,
      unknown
    >;
    expect(out.myApiKey).toBe("leak");
    expect(out.apiKey).toBe("[REDACTED]");
  });

  it("caps depth at maxDepth (depth 3 keeps leaves; deeper becomes [MAX_DEPTH])", () => {
    const deep = { a: { b: { c: { d: "too-deep" } } } };
    const out = sanitize(deep, opts) as {
      a: { b: { c: unknown } };
    };
    expect(out.a.b.c).toBe("[MAX_DEPTH]");
  });

  it("increments depth through arrays (same budget as object nesting)", () => {
    // root0 → a1 → item string at depth2 → kept
    const shallow = { a: ["leaf"] };
    const out = sanitize(shallow, opts) as { a: unknown[] };
    expect(out.a[0]).toBe("leaf");
    // root0 → a1 → item2 → b leaf at depth3 → MAX_DEPTH (depth >= 3)
    const deeper = { a: [{ b: "x" }] };
    const out2 = sanitize(deeper, opts) as {
      a: Array<{ b: unknown }>;
    };
    expect(out2.a[0].b).toBe("[MAX_DEPTH]");
  });

  it("redacts sensitive keys without descending into nested values", () => {
    const out = sanitize(
      { secret: { nested: { password: "still-secret" } }, keep: "ok" },
      opts
    ) as Record<string, unknown>;
    expect(out.secret).toBe("[REDACTED]");
    expect(out.keep).toBe("ok");
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

  it("stringifies null and undefined leaves", () => {
    const out = sanitize({ a: null, b: undefined }, opts) as Record<
      string,
      unknown
    >;
    expect(out.a).toBe("null");
    expect(out.b).toBe("undefined");
  });

  it("preserves empty objects and arrays within depth", () => {
    const out = sanitize({ o: {}, arr: [] }, opts) as {
      o: Record<string, unknown>;
      arr: unknown[];
    };
    expect(out.o).toEqual({});
    expect(out.arr).toEqual([]);
  });

  it("does not mutate the input object", () => {
    const input = { password: "hunter2", nested: { token: "t", ok: 1 } };
    const snapshot = structuredClone(input);
    sanitize(input, opts);
    expect(input).toEqual(snapshot);
  });

  it("exports DEFAULT_SANITIZE_OPTIONS with depth≤3 and name patterns", () => {
    expect(DEFAULT_SANITIZE_OPTIONS.maxDepth).toBe(3);
    expect(DEFAULT_SANITIZE_OPTIONS.namePatterns).toEqual([
      "password",
      "token",
      "secret",
    ]);
    const out = sanitize(
      { password: "x", keep: "y" },
      DEFAULT_SANITIZE_OPTIONS
    ) as Record<string, unknown>;
    expect(out.password).toBe("[REDACTED]");
    expect(out.keep).toBe("y");
  });

  it("sanitizes a root-level array within depth", () => {
    const out = sanitize([{ password: "x" }, { ok: 1 }], opts) as Array<
      Record<string, unknown>
    >;
    expect(out[0].password).toBe("[REDACTED]");
    expect(out[1].ok).toBe("1");
  });
});
