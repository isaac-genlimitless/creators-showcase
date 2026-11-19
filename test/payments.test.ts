import { test } from "node:test";
import assert from "node:assert/strict";
import { selectPaymentsProvider, TEST_PAYMENT_METHODS } from "../src/lib/providers/payments.ts";

test("production without a Stripe key fails closed", () => {
  assert.throws(() => selectPaymentsProvider({ NODE_ENV: "production" }), /STRIPE_SECRET_KEY/);
});

test("production test adapter needs an explicit opt-in", () => {
  assert.equal(selectPaymentsProvider({ NODE_ENV: "production", ALLOW_TEST_PAYMENTS: "1" }).testMode, true);
});

test("development without a key uses the test adapter", () => {
  assert.equal(selectPaymentsProvider({ NODE_ENV: "development" }).name, "test");
});

test("test adapter: success, decline and validation", async () => {
  const p = selectPaymentsProvider({ NODE_ENV: "test" });
  const ok = await p.charge({ amountCents: 10_000, applicationFeeCents: 1_500, paymentMethod: TEST_PAYMENT_METHODS.success });
  assert.equal(ok.status, "succeeded");
  const no = await p.charge({ amountCents: 10_000, applicationFeeCents: 1_500, paymentMethod: TEST_PAYMENT_METHODS.insufficientFunds });
  assert.equal(no.status === "failed" && no.failureCode, "insufficient_funds");
  await assert.rejects(p.charge({ amountCents: 100, applicationFeeCents: 200 }));
  await assert.rejects(p.refund({ chargeId: "ch_x", amountCents: -5 }));
});
