import assert from "node:assert/strict";
import { summarizeProposedAction } from "./actionSummary";
import { ProposedAction } from "./actionTypes";

const baseAction: Omit<ProposedAction, "type" | "summary" | "payload"> = {
  id: "act_001",
  timestamp: "2026-01-24T00:00:00Z",
  security: {
    requiresConfirmation: false,
  },
};

const spendAction: ProposedAction = {
  ...baseAction,
  type: "QUERY_SPEND",
  summary: "",
  payload: {
    accountId: "acc_12345",
    queryFilters: {
      merchant: "Starbucks",
      since: "2023-09-27",
    },
  },
};

const transferAction: ProposedAction = {
  ...baseAction,
  type: "PROPOSE_TRANSFER",
  summary: "",
  payload: {
    accountId: "acc_12345",
    targetId: "acc_67890",
    amount: 50,
  },
  security: {
    requiresConfirmation: true,
    proposalId: "prop_999888",
  },
};

const billPayAction: ProposedAction = {
  ...baseAction,
  type: "PROPOSE_BILL_PAY",
  summary: "",
  payload: {
    accountId: "acc_12345",
    targetId: "bill_comcast_01",
    amount: 120.5,
  },
  security: {
    requiresConfirmation: true,
    proposalId: "prop_777666",
  },
};

assert.equal(
  summarizeProposedAction({
    ...spendAction,
    summary: "Checking purchases at Starbucks from the last 30 days",
  }),
  "Checking purchases at Starbucks from the last 30 days."
);

assert.equal(summarizeProposedAction(spendAction), "Check spend at Starbucks since 2023-09-27.");
assert.equal(
  summarizeProposedAction(transferAction),
  "Propose transfer of $50.00 to acc_67890."
);
assert.equal(
  summarizeProposedAction(billPayAction),
  "Propose bill payment of $120.50 to bill_comcast_01."
);

console.log("actionSummary tests passed");
