import crypto from "node:crypto";
import { scamGuardCheck } from "../scamGuard/scamGuard";
import {
  consumeConfirmationToken,
  createConfirmationToken,
  type ConfirmationValidationResult,
} from "./confirmationToken";
import { createBillPayment, createTransfer } from "../nessie/nessieClient";

export type PolicyRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type PolicyConfirmation = "single" | "two_step";

export type PolicyScript = {
  assistantLines: string[];
};

export type TransferPolicyInput = {
  sessionId: string;
  accountId: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  avgAmount30d: number;
  recentOutgoingCount10m: number;
  projectedBalance: number;
  memo?: string;
  isNewPayee: boolean;
};

export type BillPaymentPolicyInput = {
  sessionId: string;
  accountId: string;
  billerId: string;
  billerName: string;
  amount: number;
  dueDate: string;
  accountName: string;
  avgAmount30d: number;
  recentOutgoingCount10m: number;
  projectedBalance: number;
  memo?: string;
  isNewBiller: boolean;
};

export type ProposedPolicyResult = {
  proposalId: string;
  riskLevel: PolicyRiskLevel;
  confirmation: PolicyConfirmation;
  assistantLines: string[];
  confirmationToken?: string;
};

export type SpokenConfirmationInput = {
  sessionId: string;
  proposalId: string;
  utterance: string;
};

export type SpokenConfirmationResult = {
  status: "confirmed" | "needs_strong_confirm" | "cancelled" | "ignored";
  assistantLines: string[];
  confirmationToken?: string;
};

export type ExecuteTransferInput = {
  sessionId: string;
  proposalId: string;
  confirmationToken: string;
  actionKind: "PROPOSE_TRANSFER";
  payeeId: string;
  amount: number;
  accountId: string;
  memo?: string;
};

export type ExecuteBillPaymentInput = {
  sessionId: string;
  proposalId: string;
  confirmationToken: string;
  actionKind: "PROPOSE_BILL_PAY";
  billerId: string;
  amount: number;
  accountId: string;
  memo?: string;
};

type HighRiskPending = {
  proposalId: string;
  sessionId: string;
  actionKind: "PROPOSE_TRANSFER" | "PROPOSE_BILL_PAY";
  targetId: string;
  amount: number;
};

const highRiskPending = new Map<string, HighRiskPending>();

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

const normalizeUtterance = (utterance: string) => utterance.trim().toLowerCase();

const shouldCancel = (utterance: string) => {
  const normalized = normalizeUtterance(utterance);
  return ["cancel", "no", "stop", "wait"].some((word) => normalized.includes(word));
};

const isStrongConfirm = (utterance: string) => {
  return normalizeUtterance(utterance).includes("i confirm this payment");
};

const MEDIUM_RISK_SCRIPT = (amount: number, payeeName: string): PolicyScript => ({
  assistantLines: [
    `I've set up a transfer of ${formatCurrency(amount)} to ${payeeName}.`,
    "Just so you know, you haven't paid her before.",
    "Would you like me to send it now?",
  ],
});

const HIGH_RISK_SCRIPT: PolicyScript = {
  assistantLines: [
    "Wait.",
    "I've flagged this transaction as High Risk.",
    "It's an unusually large amount for a new recipient.",
    "I've paused the transfer.",
    "Please review the red warning on your screen.",
    "To proceed, you must explicitly say: 'I confirm this payment'.",
  ],
};

const BILL_PAYMENT_SCRIPT = (billerName: string, dueDate: string, amount: number, accountName: string) => ({
  assistantLines: [
    `I found a pending bill for ${billerName} due on ${dueDate} for ${formatCurrency(amount)}.`,
    `I can pay that from your ${accountName} account.`,
    "Shall I schedule that payment?",
  ],
});

const CANCEL_SCRIPT: PolicyScript = {
  assistantLines: [
    "Understood. I've cancelled that request. No money was moved.",
    "Is there anything else I can help you with?",
  ],
};

const generateProposalId = () => {
  return `prop_${crypto.randomUUID()}`;
};

export const proposeTransferWithPolicy = (input: TransferPolicyInput): ProposedPolicyResult => {
  const scamResult = scamGuardCheck({
    accountId: input.accountId,
    targetId: input.payeeId,
    isNewTarget: input.isNewPayee,
    amount: input.amount,
    avgAmount30d: input.avgAmount30d,
    recentOutgoingCount10m: input.recentOutgoingCount10m,
    projectedBalance: input.projectedBalance,
    memo: input.memo,
  });

  const proposalId = generateProposalId();
  const riskLevel = scamResult.riskLevel as PolicyRiskLevel;
  const confirmation: PolicyConfirmation = riskLevel === "LOW" ? "single" : "two_step";

  if (riskLevel === "HIGH") {
    highRiskPending.set(proposalId, {
      proposalId,
      sessionId: input.sessionId,
      actionKind: "PROPOSE_TRANSFER",
      targetId: input.payeeId,
      amount: input.amount,
    });

    return {
      proposalId,
      riskLevel,
      confirmation,
      assistantLines: HIGH_RISK_SCRIPT.assistantLines,
    };
  }

  const confirmationToken = createConfirmationToken({
    proposalId,
    sessionId: input.sessionId,
    actionKind: "PROPOSE_TRANSFER",
    targetId: input.payeeId,
    amount: input.amount,
  });

  return {
    proposalId,
    riskLevel,
    confirmation,
    assistantLines: MEDIUM_RISK_SCRIPT(input.amount, input.payeeName).assistantLines,
    confirmationToken,
  };
};

export const proposeBillPaymentWithPolicy = (input: BillPaymentPolicyInput): ProposedPolicyResult => {
  const scamResult = scamGuardCheck({
    accountId: input.accountId,
    targetId: input.billerId,
    isNewTarget: input.isNewBiller,
    amount: input.amount,
    avgAmount30d: input.avgAmount30d,
    recentOutgoingCount10m: input.recentOutgoingCount10m,
    projectedBalance: input.projectedBalance,
    memo: input.memo,
  });

  const proposalId = generateProposalId();
  const riskLevel = scamResult.riskLevel as PolicyRiskLevel;
  const confirmation: PolicyConfirmation = riskLevel === "LOW" ? "single" : "two_step";

  if (riskLevel === "HIGH") {
    highRiskPending.set(proposalId, {
      proposalId,
      sessionId: input.sessionId,
      actionKind: "PROPOSE_BILL_PAY",
      targetId: input.billerId,
      amount: input.amount,
    });

    return {
      proposalId,
      riskLevel,
      confirmation,
      assistantLines: HIGH_RISK_SCRIPT.assistantLines,
    };
  }

  const confirmationToken = createConfirmationToken({
    proposalId,
    sessionId: input.sessionId,
    actionKind: "PROPOSE_BILL_PAY",
    targetId: input.billerId,
    amount: input.amount,
  });

  return {
    proposalId,
    riskLevel,
    confirmation,
    assistantLines: BILL_PAYMENT_SCRIPT(
      input.billerName,
      input.dueDate,
      input.amount,
      input.accountName
    ).assistantLines,
    confirmationToken,
  };
};

export const handleSpokenConfirmation = (
  input: SpokenConfirmationInput
): SpokenConfirmationResult => {
  if (shouldCancel(input.utterance)) {
    highRiskPending.delete(input.proposalId);
    return { status: "cancelled", assistantLines: CANCEL_SCRIPT.assistantLines };
  }

  const pending = highRiskPending.get(input.proposalId);
  if (!pending || pending.sessionId !== input.sessionId) {
    return { status: "ignored", assistantLines: [] };
  }

  if (!isStrongConfirm(input.utterance)) {
    return {
      status: "needs_strong_confirm",
      assistantLines: HIGH_RISK_SCRIPT.assistantLines,
    };
  }

  const confirmationToken = createConfirmationToken({
    proposalId: pending.proposalId,
    sessionId: pending.sessionId,
    actionKind: pending.actionKind,
    targetId: pending.targetId,
    amount: pending.amount,
  });
  highRiskPending.delete(input.proposalId);

  return {
    status: "confirmed",
    assistantLines: [],
    confirmationToken,
  };
};

const executeWithPolicy = (
  input: ExecuteTransferInput | ExecuteBillPaymentInput,
  executor: () => Promise<unknown>
): Promise<{ result: unknown; validation: ConfirmationValidationResult }> => {
  const validation = consumeConfirmationToken({
    token: input.confirmationToken,
    sessionId: input.sessionId,
    actionKind: input.actionKind,
    targetId: "payeeId" in input ? input.payeeId : input.billerId,
    amount: input.amount,
  });

  if (!validation.valid) {
    throw new Error(`Confirmation token invalid: ${validation.reason ?? "unknown"}`);
  }

  return executor().then((result) => ({ result, validation }));
};

export const executeTransferWithPolicy = async (input: ExecuteTransferInput) => {
  return executeWithPolicy(input, () =>
    createTransfer(input.accountId, input.payeeId, input.amount, input.memo)
  );
};

export const executeBillPaymentWithPolicy = async (input: ExecuteBillPaymentInput) => {
  return executeWithPolicy(input, () =>
    createBillPayment(input.accountId, input.billerId, input.amount, input.memo)
  );
};
