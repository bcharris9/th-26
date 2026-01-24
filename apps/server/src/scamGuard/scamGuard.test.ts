import assert from "node:assert/strict";
import { scamGuardCheck } from "./scamGuard";

const baseInput = {
  accountId: "acc_12345",
  targetId: "target_001",
  isNewTarget: false,
  amount: 50,
  avgAmount30d: 45,
  recentOutgoingCount10m: 0,
  projectedBalance: 200,
  memo: "",
};

const lowRisk = scamGuardCheck(baseInput);
assert.deepEqual(lowRisk, {
  score: 0,
  riskLevel: "LOW",
  confirmation: "single",
  reasons: [],
});

const highRiskNewPayeeLargeAmount = scamGuardCheck({
  ...baseInput,
  isNewTarget: true,
  amount: 300,
  avgAmount30d: 100,
});
assert.equal(highRiskNewPayeeLargeAmount.riskLevel, "HIGH");
assert.ok(highRiskNewPayeeLargeAmount.reasons.length >= 1);
assert.ok(
  highRiskNewPayeeLargeAmount.reasons.includes("This is your first time paying this person.")
);
assert.ok(
  highRiskNewPayeeLargeAmount.reasons.includes(
    "The amount is significantly higher than your usual payments."
  )
);

const mediumRiskLowBalance = scamGuardCheck({
  ...baseInput,
  isNewTarget: true,
  projectedBalance: 20,
});
assert.equal(mediumRiskLowBalance.riskLevel, "MEDIUM");
assert.ok(mediumRiskLowBalance.reasons.length >= 1);
assert.ok(
  mediumRiskLowBalance.reasons.includes(
    "This transfer will leave your balance critically low (under $50)."
  )
);

const highRiskVelocityDrain = scamGuardCheck({
  ...baseInput,
  recentOutgoingCount10m: 3,
  amount: 250,
  avgAmount30d: 90,
});
assert.equal(highRiskVelocityDrain.riskLevel, "HIGH");
assert.ok(highRiskVelocityDrain.reasons.length >= 1);
assert.ok(
  highRiskVelocityDrain.reasons.includes(
    "We detected multiple rapid transactions leaving your account."
  )
);

console.log("scamGuard tests passed");
