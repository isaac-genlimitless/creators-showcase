/** Creators keeps 15% of tuition. 1500 basis points = 15.00%. */
export const PLATFORM_FEE_BPS = 1500;

function assertCents(amountCents: number): void {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) throw new Error("amountCents must be a non-negative integer");
}

/** Platform fee in cents, rounded to the nearest cent. platformFee(50000) === 7500 ($500 -> $75). */
export function platformFee(amountCents: number): number {
  assertCents(amountCents);
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}

/** What the facilitator receives after the platform fee. Fee + net always equals the amount. */
export function facilitatorNet(amountCents: number): number {
  return amountCents - platformFee(amountCents);
}

/** Apply a whole-number percentage discount (e.g. sibling discount), clamped to 0-100. */
export function applyDiscount(amountCents: number, pct: number): number {
  assertCents(amountCents);
  if (!Number.isInteger(pct)) throw new Error("discount pct must be a whole number");
  const p = Math.min(100, Math.max(0, pct));
  return Math.round((amountCents * (100 - p)) / 100);
}
