/** In-process sample source for M1 microworld (no filesystem required at runtime). */
export const PAYMENT_MIDDLEWARE_FILE = "payment-middleware.ts";

export const PAYMENT_MIDDLEWARE_SOURCE = `/** Sample payment middleware for M1 microworld (ARCHITECTURE §1.3). */

export class PaymentGateway {
  charge(amount: number): boolean {
    return amount > 0 && amount < 1_000_000;
  }
}

export function paymentMiddleware(
  amount: number,
  next: () => void
): "ok" | "payment_required" {
  const gateway = new PaymentGateway();
  if (!gateway.charge(amount)) {
    return "payment_required";
  }
  next();
  return "ok";
}
`;
