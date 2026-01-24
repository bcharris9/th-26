export type TransactionStatus = "pending" | "completed" | "cancelled" | "executed";
export type TransactionMedium = "balance" | "rewards";

export interface Purchase {
  _id: string;
  merchant_id: string;
  payer_id: string;
  purchase_date: string;
  amount: number;
  status: TransactionStatus;
  medium: TransactionMedium;
  description: string;
}

export interface Bill {
  _id: string;
  status: "pending" | "recurring" | "cancelled" | "completed";
  payee: string;
  nickname: string;
  creation_date: string;
  payment_date: string;
  recurring_date: number;
  payment_amount: number;
  account_id: string;
}

export interface TransferProposal {
  proposalId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
  status: "awaiting_execution";
  expiresAt: string;
}

export interface Transfer {
  _id: string;
  type: "p2p";
  transaction_date: string;
  status: TransactionStatus;
  payer_id: string;
  payee_id: string;
  amount: number;
  description?: string;
}

export interface BillPaymentProposal {
  proposalId: string;
  billId: string;
  amount: number;
  memo?: string;
  status: "awaiting_execution";
}

export interface BillPayment {
  _id: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  status: TransactionStatus;
}

export const CLIENT_CONFIG = {
  baseURL: process.env.NESSIE_API_BASE || "http://api.nessieisreal.com",
  timeout: 4000,
  retries: 2,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

const demoMode = process.env.DEMO_MODE === "true";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requireApiKey = () => {
  const apiKey = process.env.NESSIE_API_KEY;
  if (!apiKey) {
    throw new Error("NESSIE_API_KEY is required for Nessie API requests.");
  }
  return apiKey;
};

const buildUrl = (path: string, query?: Record<string, string | undefined>) => {
  const apiKey = requireApiKey();
  const url = new URL(path, CLIENT_CONFIG.baseURL);
  url.searchParams.set("key", apiKey);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = CLIENT_CONFIG.retries) => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...CLIENT_CONFIG.headers,
          ...(options.headers ?? {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Nessie request failed: ${response.status} ${response.statusText} ${body}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt >= retries) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Nessie request failed");
};

const applyDemoGuards = async (amount: number, description?: string) => {
  if (!demoMode) {
    return;
  }
  if (amount > 10000) {
    throw new Error("DEMO_ERROR: Insufficient Funds");
  }
  if (String(amount).endsWith(".99")) {
    await sleep(3000);
  }
  if (description && description.toLowerCase().includes("fail")) {
    throw new Error("DEMO_ERROR: 503 Service Unavailable");
  }
};

const buildDemoPurchases = (accountId: string): Purchase[] => {
  const base = new Date();
  return Array.from({ length: 20 }, (_, index) => {
    const date = new Date(base.getTime() - index * 24 * 60 * 60 * 1000).toISOString();
    return {
      _id: `demo-purchase-${index + 1}`,
      merchant_id: `demo-merchant-${index + 1}`,
      payer_id: accountId,
      purchase_date: date,
      amount: Number((12.5 + index).toFixed(2)),
      status: "completed",
      medium: "balance",
      description: `Demo purchase ${index + 1}`,
    };
  });
};

export const getPurchases = async (accountId: string, startDate?: string, endDate?: string) => {
  if (demoMode && accountId === "demo_vip") {
    return buildDemoPurchases(accountId);
  }

  const url = buildUrl(`/accounts/${accountId}/purchases`, {
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetchWithRetry(url, { method: "GET" });
  return (await response.json()) as Purchase[];
};

export const listBills = async (accountId: string) => {
  const url = buildUrl(`/accounts/${accountId}/bills`);
  const response = await fetchWithRetry(url, { method: "GET" });
  return (await response.json()) as Bill[];
};

export const createTransfer = async (
  accountId: string,
  payeeId: string,
  amount: number,
  description?: string
) => {
  await applyDemoGuards(amount, description);

  if (demoMode) {
    return {
      _id: `demo-transfer-${Date.now()}`,
      type: "p2p",
      transaction_date: new Date().toISOString(),
      status: "completed",
      payer_id: accountId,
      payee_id: payeeId,
      amount,
      description,
    } satisfies Transfer;
  }

  const url = buildUrl(`/accounts/${accountId}/transfers`);
  const response = await fetchWithRetry(url, {
    method: "POST",
    body: JSON.stringify({ payee_id: payeeId, amount, description }),
  });
  return (await response.json()) as Transfer;
};

export const createBillPayment = async (
  accountId: string,
  billerId: string,
  amount: number,
  description?: string
) => {
  await applyDemoGuards(amount, description);

  if (demoMode) {
    return {
      _id: `demo-bill-payment-${Date.now()}`,
      bill_id: billerId,
      payment_date: new Date().toISOString(),
      amount,
      status: "completed",
    } satisfies BillPayment;
  }

  const url = buildUrl(`/accounts/${accountId}/bills/${billerId}/payments`);
  const response = await fetchWithRetry(url, {
    method: "POST",
    body: JSON.stringify({ amount, description }),
  });
  return (await response.json()) as BillPayment;
};
