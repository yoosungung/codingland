import { fingerprintAst, sha256Hex } from "./fingerprint";

describe("fingerprintAst", () => {
  const base = {
    kind: "function",
    name: "charge",
    uri: "file:///pay.ts",
    range: { startLine: 10, startCol: 0, endLine: 20, endCol: 1 },
  };

  it("is deterministic for the same input", () => {
    expect(fingerprintAst(base)).toBe(fingerprintAst(base));
  });

  it("changes when structural fields change", () => {
    const a = fingerprintAst(base);
    const b = fingerprintAst({ ...base, name: "refund" });
    const c = fingerprintAst({
      ...base,
      range: { ...base.range, startLine: 11 },
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it("includes optional params in the digest", () => {
    const without = fingerprintAst(base);
    const withParams = fingerprintAst({ ...base, params: ["token", "amount"] });
    expect(without).not.toBe(withParams);
  });

  it("returns a short hex string", () => {
    const fp = fingerprintAst(base);
    expect(fp).toMatch(/^[0-9a-f]{16}$/);
    const payload = JSON.stringify({
      kind: base.kind,
      name: base.name,
      uri: base.uri,
      range: base.range,
      params: [],
    });
    expect(fp).toBe(sha256Hex(payload, 16));
  });
});
