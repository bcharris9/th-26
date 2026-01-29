import { demoAccountId, demoMode } from "../config/demoConfig";
import { demoPendingBill, demoScamTrigger, demoGroceryTotal } from "../demo/demoData";
import { getPurchases } from "../nessie/nessieClient";
import { proposeActionFromGemini } from "../gemini/geminiClient";
import {
  proposeTransferWithPolicy,
  proposeBillPaymentWithPolicy,
  handleSpokenConfirmation,
  executeBillPaymentWithPolicy,
  executeTransferWithPolicy,
} from "../policy/moneyMovementPolicy";
import {
  clearPendingVoiceAction,
  getVoiceSession,
  setPendingVoiceAction,
  updateLastAction,
} from "../session/voiceSessionStore";
import type { ProposedAction } from "../actions/actionTypes";
import { validateProposedAction } from "../actions/actionSchema";

export type VoiceRequestPayload = {
  sessionId: string;
  transcript?: string;
};

export type VoiceResponsePayload = {
  transcript: string;
  assistantLines: string[];
  assistantText: string;
  judge: {
    tool: string;
    args: Record<string, unknown>;
    executed: boolean;
    riskLevel?: string;
    riskScore?: number;
    reasons?: string[];
    requiresConfirmation?: boolean;
    confirmationState?: string;
    outcome?: string;
  };
};

const normalize = (text: string) => text.trim().toLowerCase();

const detectConfirmationIntent = (transcript: string) => {
  const normalized = normalize(transcript);
  if (["cancel", "stop", "no", "never mind"].some((word) => normalized.includes(word))) {
    return "cancel";
  }
  if (["confirm", "yes", "send it", "do it"].some((word) => normalized.includes(word))) {
    return "confirm";
  }
  if (normalized.includes("i confirm this payment")) {
    return "strong_confirm";
  }
  return "none";
};

const buildAssistantText = (lines: string[]) => lines.join(" ");

const buildJudge = (action: ProposedAction | undefined, executed: boolean) => {
  return {
    tool: action?.type ?? "UNKNOWN",
    args: action?.payload ? { ...action.payload } : {},
    executed,
  };
};

const handleSpendQuery = async (
  action: ProposedAction,
  transcript: string
): Promise<VoiceResponsePayload> => {
  const merchant = action.payload.queryFilters?.merchant;

  if (demoMode) {
    const assistantLines = [
      merchant
        ? `You spent about $${demoGroceryTotal.toFixed(0)} at ${merchant} this month across 5 purchases.`
        : `You spent about $${demoGroceryTotal.toFixed(0)} on groceries this month.`,
    ];
    return {
      transcript,
      assistantLines,
      assistantText: buildAssistantText(assistantLines),
      judge: {
        ...buildJudge(action, false),
        riskLevel: "LOW",
        riskScore: 0,
        reasons: [],
        requiresConfirmation: false,
        confirmationState: "none",
        outcome: "ok",
      },
    };
  }

  const purchases = await getPurchases(action.payload.accountId);
  const filtered = merchant
    ? purchases.filter((purchase) =>
        purchase.description?.toLowerCase().includes(merchant.toLowerCase())
      )
    : purchases;
  const total = filtered.reduce((sum, purchase) => sum + purchase.amount, 0);
  const assistantLines = [
    merchant
      ? `You spent $${total.toFixed(2)} at ${merchant} across ${filtered.length} purchases.`
      : `You spent $${total.toFixed(2)} across ${filtered.length} purchases.`,
  ];

  return {
    transcript,
    assistantLines,
    assistantText: buildAssistantText(assistantLines),
    judge: {
      ...buildJudge(action, false),
      riskLevel: "LOW",
      riskScore: 0,
      reasons: [],
      requiresConfirmation: false,
      confirmationState: "none",
      outcome: "ok",
    },
  };
};

const buildRiskInputs = (action: ProposedAction, transcript: string) => {
  if (demoMode && action.type === "PROPOSE_TRANSFER") {
    const isHighRisk =
      action.payload.amount >= demoScamTrigger.amount || normalize(transcript).includes("irs");
    return {
      avgAmount30d: isHighRisk ? 125 : 40,
      recentOutgoingCount10m: isHighRisk ? 4 : 1,
      projectedBalance: isHighRisk ? 20 : 800,
      isNewTarget: true,
    };
  }

  if (demoMode && action.type === "PROPOSE_BILL_PAY") {
    return {
      avgAmount30d: 120,
      recentOutgoingCount10m: 1,
      projectedBalance: 450,
      isNewTarget: false,
    };
  }

  return {
    avgAmount30d: 100,
    recentOutgoingCount10m: 1,
    projectedBalance: 500,
    isNewTarget: true,
  };
};

const derivePayeeName = (transcript: string) => {
  const normalized = normalize(transcript);
  if (normalized.includes("alice")) {
    return "Alice";
  }
  if (normalized.includes("uncle bob")) {
    return "Uncle Bob";
  }
  return "Payee";
};

export const handleVoiceFlow = async (
  payload: VoiceRequestPayload
): Promise<VoiceResponsePayload> => {
  const { sessionId } = payload;
  const transcript = payload.transcript?.trim() ?? "";
  if (!transcript) {
    return {
      transcript: "",
      assistantLines: ["I didn't catch that. Please try again."],
      assistantText: "I didn't catch that. Please try again.",
      judge: {
        tool: "NONE",
        args: {},
        executed: false,
        outcome: "no_transcript",
      },
    };
  }

  const session = getVoiceSession(sessionId);
  const intent = detectConfirmationIntent(transcript);

  if (intent !== "none" && session.pendingAction) {
    if (intent === "cancel") {
      clearPendingVoiceAction(sessionId);
      const assistantLines = [
        "Understood. I've cancelled that request. No money was moved.",
        "Is there anything else I can help you with?",
      ];
      return {
        transcript,
        assistantLines,
        assistantText: buildAssistantText(assistantLines),
        judge: {
          ...buildJudge(session.lastAction, false),
          confirmationState: "cancelled",
          outcome: "cancelled",
        },
      };
    }

    if (session.pendingAction.riskLevel === "HIGH") {
      const confirmation = handleSpokenConfirmation({
        sessionId,
        proposalId: session.pendingAction.proposalId,
        utterance: transcript,
      });

      if (confirmation.status === "needs_strong_confirm") {
        return {
          transcript,
          assistantLines: confirmation.assistantLines,
          assistantText: buildAssistantText(confirmation.assistantLines),
          judge: {
            ...buildJudge(session.lastAction, false),
            riskLevel: session.pendingAction.riskLevel,
            riskScore: session.pendingAction.riskScore,
            reasons: session.pendingAction.riskReasons,
            requiresConfirmation: true,
            confirmationState: "needs_strong_confirm",
            outcome: "blocked",
          },
        };
      }

      if (confirmation.status === "confirmed" && confirmation.confirmationToken) {
        const pending = session.pendingAction;
        try {
          if (pending.actionKind === "PROPOSE_TRANSFER") {
            await executeTransferWithPolicy({
              sessionId,
              proposalId: pending.proposalId,
              confirmationToken: confirmation.confirmationToken,
              actionKind: "PROPOSE_TRANSFER",
              payeeId: pending.payload.targetId ?? "",
              amount: pending.payload.amount ?? 0,
              accountId: pending.payload.accountId,
              memo: pending.payload.memo,
            });
          } else {
            await executeBillPaymentWithPolicy({
              sessionId,
              proposalId: pending.proposalId,
              confirmationToken: confirmation.confirmationToken,
              actionKind: "PROPOSE_BILL_PAY",
              billerId: pending.payload.targetId ?? "",
              amount: pending.payload.amount ?? 0,
              accountId: pending.payload.accountId,
              memo: pending.payload.memo,
            });
          }

          clearPendingVoiceAction(sessionId);
          const assistantLines = ["Confirmed. The payment is now complete."];
          return {
            transcript,
            assistantLines,
            assistantText: buildAssistantText(assistantLines),
            judge: {
              ...buildJudge(session.lastAction, true),
              riskLevel: pending.riskLevel,
              riskScore: pending.riskScore,
              reasons: pending.riskReasons,
              requiresConfirmation: true,
              confirmationState: "confirmed",
              outcome: "executed",
            },
          };
        } catch (error) {
          const assistantLines = ["Sorry, something went wrong while executing that request."];
          return {
            transcript,
            assistantLines,
            assistantText: buildAssistantText(assistantLines),
            judge: {
              ...buildJudge(session.lastAction, false),
              riskLevel: pending.riskLevel,
              riskScore: pending.riskScore,
              reasons: pending.riskReasons,
              requiresConfirmation: true,
              confirmationState: "failed",
              outcome: "failed",
            },
          };
        }
      }
    }

    if (session.pendingAction.confirmationToken) {
      const pending = session.pendingAction;
      try {
        if (pending.actionKind === "PROPOSE_TRANSFER") {
          await executeTransferWithPolicy({
            sessionId,
            proposalId: pending.proposalId,
            confirmationToken: pending.confirmationToken,
            actionKind: "PROPOSE_TRANSFER",
            payeeId: pending.payload.targetId ?? "",
            amount: pending.payload.amount ?? 0,
            accountId: pending.payload.accountId,
            memo: pending.payload.memo,
          });
        } else {
          await executeBillPaymentWithPolicy({
            sessionId,
            proposalId: pending.proposalId,
            confirmationToken: pending.confirmationToken,
            actionKind: "PROPOSE_BILL_PAY",
            billerId: pending.payload.targetId ?? "",
            amount: pending.payload.amount ?? 0,
            accountId: pending.payload.accountId,
            memo: pending.payload.memo,
          });
        }

        clearPendingVoiceAction(sessionId);
        const assistantLines = ["Confirmed. The payment is now complete."];
        return {
          transcript,
          assistantLines,
          assistantText: buildAssistantText(assistantLines),
          judge: {
            ...buildJudge(session.lastAction, true),
            riskLevel: pending.riskLevel,
            riskScore: pending.riskScore,
            reasons: pending.riskReasons,
            requiresConfirmation: true,
            confirmationState: "confirmed",
            outcome: "executed",
          },
        };
      } catch (error) {
        const assistantLines = ["Sorry, something went wrong while executing that request."];
        return {
          transcript,
          assistantLines,
          assistantText: buildAssistantText(assistantLines),
          judge: {
            ...buildJudge(session.lastAction, false),
            riskLevel: pending.riskLevel,
            riskScore: pending.riskScore,
            reasons: pending.riskReasons,
            requiresConfirmation: true,
            confirmationState: "failed",
            outcome: "failed",
          },
        };
      }
    }
  }

  const accountId = demoAccountId;
  const proposed = await proposeActionFromGemini(
    transcript,
    accountId,
    process.env.SAFE_TRANSFER_PAYEE_ID,
    process.env.SAFE_BILL_ID
  );
  const action = validateProposedAction(proposed);
  updateLastAction(sessionId, transcript, action);

  if (action.type === "QUERY_SPEND") {
    return handleSpendQuery(action, transcript);
  }

  if (action.type === "PROPOSE_TRANSFER") {
    const riskInputs = buildRiskInputs(action, transcript);
    const policy = proposeTransferWithPolicy({
      sessionId,
      accountId: action.payload.accountId,
      payeeId: action.payload.targetId ?? "",
      payeeName: derivePayeeName(transcript),
      amount: action.payload.amount ?? 0,
      avgAmount30d: riskInputs.avgAmount30d,
      recentOutgoingCount10m: riskInputs.recentOutgoingCount10m,
      projectedBalance: riskInputs.projectedBalance,
      memo: action.payload.memo,
      isNewPayee: riskInputs.isNewTarget,
    });

    setPendingVoiceAction(sessionId, {
      proposalId: policy.proposalId,
      actionKind: action.type,
      payload: action.payload,
      riskLevel: policy.riskLevel,
      riskScore: policy.riskScore,
      riskReasons: policy.riskReasons,
      confirmationToken: policy.confirmationToken,
    });

    return {
      transcript,
      assistantLines: policy.assistantLines,
      assistantText: buildAssistantText(policy.assistantLines),
      judge: {
        ...buildJudge(action, false),
        riskLevel: policy.riskLevel,
        riskScore: policy.riskScore,
        reasons: policy.riskReasons,
        requiresConfirmation: true,
        confirmationState: "pending",
        outcome: "pending_confirmation",
      },
    };
  }

  const riskInputs = buildRiskInputs(action, transcript);
  const policy = proposeBillPaymentWithPolicy({
    sessionId,
    accountId: action.payload.accountId,
    billerId: action.payload.targetId ?? "",
    billerName: demoPendingBill.biller,
    amount: action.payload.amount ?? demoPendingBill.amount,
    dueDate: demoPendingBill.dueDate,
    accountName: "Checking",
    avgAmount30d: riskInputs.avgAmount30d,
    recentOutgoingCount10m: riskInputs.recentOutgoingCount10m,
    projectedBalance: riskInputs.projectedBalance,
    memo: action.payload.memo,
    isNewBiller: riskInputs.isNewTarget,
  });

  setPendingVoiceAction(sessionId, {
    proposalId: policy.proposalId,
    actionKind: action.type,
    payload: action.payload,
    riskLevel: policy.riskLevel,
    riskScore: policy.riskScore,
    riskReasons: policy.riskReasons,
    confirmationToken: policy.confirmationToken,
  });

  return {
    transcript,
    assistantLines: policy.assistantLines,
    assistantText: buildAssistantText(policy.assistantLines),
    judge: {
      ...buildJudge(action, false),
      riskLevel: policy.riskLevel,
      riskScore: policy.riskScore,
      reasons: policy.riskReasons,
      requiresConfirmation: true,
      confirmationState: "pending",
      outcome: "pending_confirmation",
    },
  };
};
