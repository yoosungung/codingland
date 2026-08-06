import { defaultConfidence, isExtracted } from "./edgeConfidence";

describe("edgeConfidence", () => {
  it("defaults undefined to extracted", () => {
    expect(defaultConfidence(undefined)).toBe("extracted");
    expect(defaultConfidence("inferred")).toBe("inferred");
    expect(defaultConfidence("extracted")).toBe("extracted");
  });

  it("isExtracted treats missing as extracted", () => {
    expect(isExtracted(undefined)).toBe(true);
    expect(isExtracted("extracted")).toBe(true);
    expect(isExtracted("inferred")).toBe(false);
  });
});
