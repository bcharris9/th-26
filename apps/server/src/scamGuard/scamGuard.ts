export type ScamGuardRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type ScamGuardConfirmation = "single" | "two_step";

export type ScamGuardInput = {
  accountId: string;
  targetId: string;
  isNewTarget: boolean;
  amount: number;
  avgAmount30d: number;
  recentOutgoingCount10m: number;
  projectedBalance: number;
  memo?: string;
};

export type ScamGuardResult = {
  score: number;
  riskLevel: ScamGuardRiskLevel;
  confirmation: ScamGuardConfirmation;
  reasons: string[];
};

export const SCAM_GUARD_CONSTANTS = {
  SCORE_NEW_RELATIONSHIP: 30,
  SCORE_ABNORMAL_AMOUNT: 40,
  SCORE_VELOCITY_DRAIN: 50,
  SCORE_LIQUIDITY_RISK: 20,
  SCORE_COERCION_FLAGS: 35,
  LOW_MAX: 29,
  MEDIUM_MAX: 69,
  ABNORMAL_AMOUNT_MULTIPLIER: 2,
  VELOCITY_THRESHOLD: 3,
  LOW_BALANCE_THRESHOLD: 50,
  COERCION_KEYWORDS: ["urgent", "irs", "bail", "gift card", "immediate", "audit"],
} as const;

const RULE_REASONS = {
  NEW_RELATIONSHIP: "This is your first time paying this person.",
  ABNORMAL_AMOUNT: "The amount is significantly higher than your usual payments.",
  VELOCITY_DRAIN: "We detected multiple rapid transactions leaving your account.",
  LIQUIDITY_RISK: "This transfer will leave your balance critically low (under $50).",
  COERCION_FLAGS: "The payment description contains words often associated with scams.",
};

const includesCoercionKeyword = (memo: string | undefined) => {
  if (!memo) {
    return false;
  }
  const normalized = memo.toLowerCase();
  return SCAM_GUARD_CONSTANTS.COERCION_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const scamGuardCheck = (input: ScamGuardInput): ScamGuardResult => {
  let score = 0;
  const reasons: string[] = [];

  if (input.isNewTarget) {
    score += SCAM_GUARD_CONSTANTS.SCORE_NEW_RELATIONSHIP;
    reasons.push(RULE_REASONS.NEW_RELATIONSHIP);
  }

  if (
    input.avgAmount30d > 0 &&
    input.amount > input.avgAmount30d * SCAM_GUARD_CONSTANTS.ABNORMAL_AMOUNT_MULTIPLIER
  ) {
    score += SCAM_GUARD_CONSTANTS.SCORE_ABNORMAL_AMOUNT;
    reasons.push(RULE_REASONS.ABNORMAL_AMOUNT);
  }

  if (input.recentOutgoingCount10m >= SCAM_GUARD_CONSTANTS.VELOCITY_THRESHOLD) {
    score += SCAM_GUARD_CONSTANTS.SCORE_VELOCITY_DRAIN;
    reasons.push(RULE_REASONS.VELOCITY_DRAIN);
  }

  if (input.projectedBalance < SCAM_GUARD_CONSTANTS.LOW_BALANCE_THRESHOLD) {
    score += SCAM_GUARD_CONSTANTS.SCORE_LIQUIDITY_RISK;
    reasons.push(RULE_REASONS.LIQUIDITY_RISK);
  }

  if (includesCoercionKeyword(input.memo)) {
    score += SCAM_GUARD_CONSTANTS.SCORE_COERCION_FLAGS;
    reasons.push(RULE_REASONS.COERCION_FLAGS);
  }

  let riskLevel: ScamGuardRiskLevel = "LOW";
  let confirmation: ScamGuardConfirmation = "single";

  if (score > SCAM_GUARD_CONSTANTS.MEDIUM_MAX) {
    riskLevel = "HIGH";
    confirmation = "two_step";
  } else if (score > SCAM_GUARD_CONSTANTS.LOW_MAX) {
    riskLevel = "MEDIUM";
    confirmation = "two_step";
  }

  return {
    score,
    riskLevel,
    confirmation,
    reasons,
  };
};
