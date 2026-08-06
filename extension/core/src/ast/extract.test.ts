import {
  PAYMENT_MIDDLEWARE_FILE,
  PAYMENT_MIDDLEWARE_SOURCE,
} from "./paymentSample";
import { extractGraphFromSource } from "./extract";
import { aggregateDebt } from "../graph/debt";
import { applySemanticZoom } from "../graph/layout";

describe("extractGraphFromSource (payment middleware)", () => {
  const source = PAYMENT_MIDDLEWARE_SOURCE;
  const uri = "file:///sample/payment-middleware.ts";

  it("builds Module/Class boundary with extracted edges", () => {
    const snap = extractGraphFromSource({
      source,
      uri,
      fileName: PAYMENT_MIDDLEWARE_FILE,
    });

    expect(snap.zoomLevel).toBe("boundary");
    const kinds = Object.fromEntries(snap.nodes.map((n) => [n.name, n.kind]));
    expect(kinds.PaymentGateway).toBe("class");
    expect(kinds.paymentMiddleware).toBe("function");
    expect(snap.nodes.some((n) => n.kind === "module")).toBe(true);

    for (const e of snap.edges) {
      expect(e.confidence ?? "extracted").toBe("extracted");
    }
    expect(snap.edges.some((e) => e.kind === "contains")).toBe(true);
    expect(snap.edges.some((e) => e.kind === "calls")).toBe(true);
  });

  it("assigns anchors so zoom does not jump landmarks", () => {
    const full = extractGraphFromSource({
      source,
      uri,
      fileName: PAYMENT_MIDDLEWARE_FILE,
    });
    const boundary = applySemanticZoom(full, "boundary");
    const zoomedIn = applySemanticZoom(full, "function");

    const gatewayBoundary = boundary.nodes.find(
      (n) => n.name === "PaymentGateway"
    );
    const gatewayZoomed = zoomedIn.nodes.find(
      (n) => n.name === "PaymentGateway"
    );
    expect(gatewayBoundary?.anchor).toBeDefined();
    expect(gatewayZoomed?.anchor).toEqual(gatewayBoundary?.anchor);
  });

  it("Debt stub counts only extracted unverified nodes", () => {
    const snap = extractGraphFromSource({
      source,
      uri,
      fileName: PAYMENT_MIDDLEWARE_FILE,
    });
    const debt = aggregateDebt(snap);
    expect(debt.unverified).toBe(snap.nodes.length);
    expect(debt.verified).toBe(0);
    expect(debt.bypassed).toBe(0);
  });
});
