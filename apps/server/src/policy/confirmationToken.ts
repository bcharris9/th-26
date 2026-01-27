import crypto from "node:crypto";
import {
  getPendingAction,
  markPendingActionCompleted,
  removePendingAction,
  setPendingAction,
  type PendingAction,
} from "../session/sessionStore";

export type ConfirmationTokenInput = {
  proposalId: string;
  sessionId: string;
  actionKind: string;
  targetId: string;
  amount: number;
  timestamp?: string;
};

export type ConfirmationValidationInput = {
  token: string;
  sessionId: string;
  actionKind: string;
  targetId: string;
  amount: number;
  now?: string;
};

export type ConfirmationValidationResult = {
  valid: boolean;
  reason?: string;
  proposalId?: string;
};

export const CONFIRMATION_CONSTANTS = {
  TOKEN_SEPARATOR: ".",
  TOKEN_EXPIRY_MS: 10 * 60 * 1000,
} as const;

const getSecret = () => {
  const secret = process.env.CONFIRMATION_SECRET;
  if (!secret) {
    throw new Error("CONFIRMATION_SECRET is required for confirmation tokens.");
  }
  return secret;
};

const buildBindingString = (action: PendingAction) => {
  return `${action.sessionId}|${action.actionKind}|${action.targetId}|${action.amount}|${action.timestamp}`;
};

const signBindingString = (binding: string) => {
  return crypto.createHmac("sha256", getSecret()).update(binding).digest("hex");
};

const parseToken = (token: string) => {
  const [proposalId, signature] = token.split(CONFIRMATION_CONSTANTS.TOKEN_SEPARATOR);
  if (!proposalId || !signature) {
    return null;
  }
  return { proposalId, signature };
};

const isExpired = (timestamp: string, nowIso?: string) => {
  const createdAt = new Date(timestamp).getTime();
  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  return Number.isNaN(createdAt) || now - createdAt > CONFIRMATION_CONSTANTS.TOKEN_EXPIRY_MS;
};

export const createConfirmationToken = (input: ConfirmationTokenInput) => {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const action: PendingAction = {
    proposalId: input.proposalId,
    sessionId: input.sessionId,
    actionKind: input.actionKind,
    targetId: input.targetId,
    amount: input.amount,
    timestamp,
    status: "AWAITING_CONFIRMATION",
  };

  const binding = buildBindingString(action);
  const signature = signBindingString(binding);
  setPendingAction(action);
  return `${input.proposalId}${CONFIRMATION_CONSTANTS.TOKEN_SEPARATOR}${signature}`;
};

export const validateConfirmationToken = (
  input: ConfirmationValidationInput
): ConfirmationValidationResult => {
  const parsed = parseToken(input.token);
  if (!parsed) {
    return { valid: false, reason: "invalid_format" };
  }

  const action = getPendingAction(input.sessionId, parsed.proposalId);
  if (!action) {
    return { valid: false, reason: "missing_or_session_mismatch" };
  }

  if (action.status !== "AWAITING_CONFIRMATION") {
    return { valid: false, reason: "already_confirmed" };
  }

  if (action.actionKind !== input.actionKind) {
    return { valid: false, reason: "action_kind_mismatch" };
  }

  if (action.targetId !== input.targetId) {
    return { valid: false, reason: "target_mismatch" };
  }

  if (action.amount !== input.amount) {
    return { valid: false, reason: "amount_mismatch" };
  }

  if (isExpired(action.timestamp, input.now)) {
    return { valid: false, reason: "expired" };
  }

  const expectedSignature = signBindingString(buildBindingString(action));
  if (!crypto.timingSafeEqual(Buffer.from(parsed.signature), Buffer.from(expectedSignature))) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true, proposalId: parsed.proposalId };
};

export const consumeConfirmationToken = (
  input: ConfirmationValidationInput
): ConfirmationValidationResult => {
  const result = validateConfirmationToken(input);
  if (!result.valid || !result.proposalId) {
    return result;
  }

  markPendingActionCompleted(input.sessionId, result.proposalId);
  removePendingAction(input.sessionId, result.proposalId);
  return result;
};
