import { test } from "node:test";
import assert from "node:assert/strict";
import { platformFee, facilitatorNet, applyDiscount } from "../src/lib/fees.ts";

test("15% platform fee in cents", () => {
  assert.equal(platformFee(50_000), 7_500);
  assert.equal(platformFee(0), 0);
  assert.equal(platformFee(333), 50); // 49.95 rounds to 50
});

test("fee + net always equals the amount", () => {
  for (const amt of [1, 7, 333, 99_999, 1_234_567]) assert.equal(platformFee(amt) + facilitatorNet(amt), amt);
});

test("rejects non-integer, negative and NaN amounts", () => {
  for (const bad of [-1, 10.5, Number.NaN, Number.POSITIVE_INFINITY]) assert.throws(() => platformFee(bad));
});

test("discounts clamp to 0-100 and reject junk", () => {
  assert.equal(applyDiscount(10_000, 10), 9_000);
  assert.equal(applyDiscount(10_000, 150), 0);
  assert.equal(applyDiscount(10_000, -5), 10_000);
  assert.throws(() => applyDiscount(10_000, Number.NaN));
  assert.throws(() => applyDiscount(10_000, 12.5));
});
