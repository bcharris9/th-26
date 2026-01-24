export type ActionKind = "QUERY_SPEND" | "PROPOSE_TRANSFER" | "PROPOSE_BILL_PAY";

export type ActionQueryFilters = {
  merchant?: string;
  since?: string;
};

export type ActionPayload = {
  accountId: string;
  targetId?: string;
  amount?: number;
  currency?: string;
  memo?: string;
  queryFilters?: ActionQueryFilters;
};

export type ActionSecurity = {
  requiresConfirmation: boolean;
  proposalId?: string;
  confirmationToken?: string;
};

export type ProposedAction = {
  id: string;
  type: ActionKind;
  summary: string;
  timestamp: string;
  payload: ActionPayload;
  security: ActionSecurity;
};
