import { ProposedAction } from "./actionTypes";

const formatAmount = (amount: number | undefined, currency: string | undefined) => {
  if (amount === undefined || !Number.isFinite(amount)) {
    return undefined;
  }
  const safeCurrency = currency ?? "USD";
  if (safeCurrency === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${safeCurrency}`;
};

const normalizeSummary = (summary: string) => {
  const firstLine = summary.trim().split("\n")[0].trim();
  if (!firstLine) {
    return "";
  }
  return firstLine.endsWith(".") ? firstLine : `${firstLine}.`;
};

export const summarizeProposedAction = (proposedAction: ProposedAction) => {
  const cleaned = normalizeSummary(proposedAction.summary);
  if (cleaned) {
    return cleaned;
  }

  const { payload, type } = proposedAction;
  const amount = formatAmount(payload.amount, payload.currency);

  if (type === "QUERY_SPEND") {
    const merchant = payload.queryFilters?.merchant;
    const since = payload.queryFilters?.since;
    if (merchant && since) {
      return `Check spend at ${merchant} since ${since}.`;
    }
    if (merchant) {
      return `Check spend at ${merchant}.`;
    }
    if (since) {
      return `Check spend since ${since}.`;
    }
    return `Check spend for account ${payload.accountId}.`;
  }

  if (type === "PROPOSE_TRANSFER") {
    if (amount && payload.targetId) {
      return `Propose transfer of ${amount} to ${payload.targetId}.`;
    }
    if (amount) {
      return `Propose transfer of ${amount}.`;
    }
    return `Propose transfer from account ${payload.accountId}.`;
  }

  if (type === "PROPOSE_BILL_PAY") {
    if (amount && payload.targetId) {
      return `Propose bill payment of ${amount} to ${payload.targetId}.`;
    }
    if (amount) {
      return `Propose bill payment of ${amount}.`;
    }
    return `Propose bill payment from account ${payload.accountId}.`;
  }

  return "Review proposed action.";
};
