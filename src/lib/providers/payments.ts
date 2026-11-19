import "server-only";
import crypto from "node:crypto";

/**
 * Payments adapter (Stripe Connect shaped). TEST mode is used whenever STRIPE_SECRET_KEY is absent.
 * Feature code calls `payments()` and never imports a provider SDK directly.
 *
 * Test behaviour:
 *  - charge() succeeds unless: input.forceFail, env TEST_PAYMENTS_FAIL=1, or paymentMethod is a
 *    decline test value (see TEST_PAYMENT_METHODS.decline / .insufficientFunds).
 *  - refund() always succeeds.
 *  - connected accounts are "acct_test_*" and report payoutsReady=true once onboarding was "completed"
 *    (test onboarding link just returns your returnUrl with ?test_onboarding=complete).
 */

export const TEST_PAYMENT_METHODS = {
  success: "pm_card_visa",
  decline: "pm_card_chargeDeclined",
  insufficientFunds: "pm_card_chargeDeclinedInsufficientFunds",
} as const;
const DECLINES = new Set<string>([
  TEST_PAYMENT_METHODS.decline,
  TEST_PAYMENT_METHODS.insufficientFunds,
  "4000000000000002",
  "4000000000009995",
]);

export type ChargeInput = {
  amountCents: number;
  applicationFeeCents: number;
  destinationAccountId?: string | null;
  customerRef?: string;
  paymentMethod?: string;
  description?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
  forceFail?: boolean;
};

export type ChargeResult =
  | { status: "succeeded"; chargeId: string; provider: string }
  | { status: "failed"; chargeId: string | null; provider: string; failureCode: string; failureMessage: string };

export type RefundResult = { status: "succeeded" | "failed"; refundId: string | null; amountCents: number; provider: string };

export interface PaymentsProvider {
  readonly name: string;
  readonly testMode: boolean;
  createConnectedAccount(input: { userId: string; email: string; name?: string }): Promise<{ accountId: string }>;
  createOnboardingLink(input: { accountId: string; returnUrl: string; refreshUrl: string }): Promise<{ url: string }>;
  getAccountStatus(accountId: string): Promise<{ payoutsReady: boolean; detailsSubmitted: boolean }>;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(input: { chargeId: string; amountCents: number; reason?: string }): Promise<RefundResult>;
}

const rid = (prefix: string) => `${prefix}_test_${crypto.randomBytes(9).toString("base64url")}`;

class TestPaymentsProvider implements PaymentsProvider {
  readonly name = "test";
  readonly testMode = true;

  async createConnectedAccount() {
    return { accountId: rid("acct") };
  }
  async createOnboardingLink({ returnUrl }: { accountId: string; returnUrl: string; refreshUrl: string }) {
    const sep = returnUrl.includes("?") ? "&" : "?";
    return { url: `${returnUrl}${sep}test_onboarding=complete` };
  }
  async getAccountStatus(accountId: string) {
    const ok = accountId.startsWith("acct_test_");
    return { payoutsReady: ok, detailsSubmitted: ok };
  }
  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new Error("amountCents must be a positive integer");
    if (input.applicationFeeCents < 0 || input.applicationFeeCents > input.amountCents) throw new Error("bad applicationFeeCents");
    const fail =
      input.forceFail || process.env.TEST_PAYMENTS_FAIL === "1" || (input.paymentMethod && DECLINES.has(input.paymentMethod));
    if (fail) {
      const insufficient = input.paymentMethod?.includes("Insufficient") || input.paymentMethod === "4000000000009995";
      return {
        status: "failed",
        chargeId: rid("ch"),
        provider: this.name,
        failureCode: insufficient ? "insufficient_funds" : "card_declined",
        failureMessage: insufficient ? "Your card has insufficient funds." : "Your card was declined.",
      };
    }
    return { status: "succeeded", chargeId: rid("ch"), provider: this.name };
  }
  async refund({ amountCents }: { chargeId: string; amountCents: number }): Promise<RefundResult> {
    return { status: "succeeded", refundId: rid("re"), amountCents, provider: this.name };
  }
}

class StripePaymentsProvider implements PaymentsProvider {
  readonly name = "stripe";
  readonly testMode = false;
  private notYet(): never {
    throw new Error("Stripe provider not implemented yet — unset STRIPE_SECRET_KEY to use the test adapter");
  }
  createConnectedAccount(): Promise<{ accountId: string }> { return this.notYet(); }
  createOnboardingLink(): Promise<{ url: string }> { return this.notYet(); }
  getAccountStatus(): Promise<{ payoutsReady: boolean; detailsSubmitted: boolean }> { return this.notYet(); }
  charge(): Promise<ChargeResult> { return this.notYet(); }
  refund(): Promise<RefundResult> { return this.notYet(); }
}

let instance: PaymentsProvider | null = null;
export function payments(): PaymentsProvider {
  instance ??= process.env.STRIPE_SECRET_KEY ? new StripePaymentsProvider() : new TestPaymentsProvider();
  return instance;
}
