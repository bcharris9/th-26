import crypto from "node:crypto";
import { env } from "../env";
import { summarizeProposedAction } from "../actions/actionSummary";
import type { ProposedAction } from "../actions/actionTypes";

type GeminiFunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const buildPrompt = (transcript: string, accountId: string) => {
  return [
    "You are SpendScribe, a voice banking assistant.",
    "Choose exactly one tool to call based on the user request.",
    "Only call tools that are defined. Do not answer with free text.",
    `User transcript: ${transcript}`,
    `Default accountId: ${accountId}`,
  ].join("\n");
};

const functionDeclarations = [
  {
    name: "query_spend",
    description: "Look up spend history for the account, optionally filtered by merchant or date.",
    parameters: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        merchant: { type: "string" },
        since: { type: "string", description: "ISO date or natural language timeframe." },
      },
      required: ["accountId"],
    },
  },
  {
    name: "propose_transfer",
    description: "Propose a transfer to a payee. Requires explicit confirmation before executing.",
    parameters: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        payeeName: { type: "string" },
        payeeId: { type: "string" },
        amount: { type: "number" },
        memo: { type: "string" },
      },
      required: ["accountId", "amount"],
    },
  },
  {
    name: "propose_bill_pay",
    description: "Propose paying a bill. Requires explicit confirmation before executing.",
    parameters: {
      type: "object",
      properties: {
        accountId: { type: "string" },
        billerName: { type: "string" },
        billerId: { type: "string" },
        amount: { type: "number" },
        memo: { type: "string" },
      },
      required: ["accountId", "amount"],
    },
  },
];

const extractFunctionCall = (payload: any): GeminiFunctionCall | null => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return null;
  }
  for (const part of parts) {
    if (part?.functionCall?.name) {
      return {
        name: part.functionCall.name,
        args: part.functionCall.args ?? {},
      };
    }
  }
  return null;
};

const safeNumber = (value: unknown, fallback: number) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const mockGeminiAction = (transcript: string, accountId: string) => {
  const normalized = transcript.toLowerCase();
  if (normalized.includes("whole foods") || normalized.includes("kroger") || normalized.includes("spend")) {
    return {
      name: "query_spend",
      args: {
        accountId,
        merchant: normalized.includes("whole foods")
          ? "Whole Foods"
          : normalized.includes("kroger")
            ? "Kroger"
            : undefined,
        since: normalized.includes("month") ? "this month" : undefined,
      },
    } satisfies GeminiFunctionCall;
  }

  if (normalized.includes("bill")) {
    return {
      name: "propose_bill_pay",
      args: {
        accountId,
        billerName: normalized.includes("electric") ? "Electric Bill" : "Bill Payment",
        amount: normalized.includes("145") ? 145.2 : 145.2,
      },
    } satisfies GeminiFunctionCall;
  }

  const amount = normalized.includes("2500") ? 2500 : normalized.includes("45") ? 45 : 25;
  return {
    name: "propose_transfer",
    args: {
      accountId,
      payeeName: normalized.includes("alice") ? "Alice" : normalized.includes("uncle bob") ? "Uncle Bob" : "Payee",
      amount,
      memo: normalized.includes("irs") ? "IRS" : undefined,
    },
  } satisfies GeminiFunctionCall;
};

const normalizeArgs = (args: unknown) => {
  if (args && typeof args === "object") {
    return args as Record<string, unknown>;
  }
  if (typeof args === "string") {
    try {
      return JSON.parse(args) as Record<string, unknown>;
    } catch (error) {
      return {};
    }
  }
  return {};
};

const mapToProposedAction = (
  call: GeminiFunctionCall,
  accountId: string,
  safeTransferPayeeId?: string,
  safeBillId?: string
): ProposedAction => {
  const now = new Date().toISOString();
  const args = normalizeArgs(call.args);

  if (call.name === "query_spend") {
    const merchant = typeof args.merchant === "string" ? args.merchant : undefined;
    const since = typeof args.since === "string" ? args.since : undefined;
    return {
      id: `act_${crypto.randomUUID()}`,
      type: "QUERY_SPEND",
      summary: "Query spend for account.",
      timestamp: now,
      payload: {
        accountId,
        queryFilters: { merchant, since },
      },
      security: { requiresConfirmation: false },
    };
  }

  if (call.name === "propose_transfer") {
    const amount = safeNumber(args.amount, 25);
    return {
      id: `act_${crypto.randomUUID()}`,
      type: "PROPOSE_TRANSFER",
      summary: "Propose a transfer.",
      timestamp: now,
      payload: {
        accountId,
        targetId: typeof args.payeeId === "string" ? args.payeeId : safeTransferPayeeId ?? "demo-payee",
        amount,
        memo: typeof args.memo === "string" ? args.memo : undefined,
      },
      security: { requiresConfirmation: true },
    };
  }

  if (call.name === "propose_bill_pay") {
    const amount = safeNumber(args.amount, 50);
    return {
      id: `act_${crypto.randomUUID()}`,
      type: "PROPOSE_BILL_PAY",
      summary: "Propose a bill payment.",
      timestamp: now,
      payload: {
        accountId,
        targetId: typeof args.billerId === "string" ? args.billerId : safeBillId ?? "demo-bill",
        amount,
        memo: typeof args.memo === "string" ? args.memo : undefined,
      },
      security: { requiresConfirmation: true },
    };
  }

  throw new Error(`Unknown Gemini function call: ${call.name}`);
};

export const proposeActionFromGemini = async (
  transcript: string,
  accountId: string,
  safeTransferPayeeId?: string,
  safeBillId?: string
) => {
  const useMock =
    env.DEMO_MODE === true && (!env.GEMINI_API_KEY || process.env.MOCK_PROVIDERS === "true");

  const functionCall = useMock
    ? mockGeminiAction(transcript, accountId)
    : await (async () => {
        if (!env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is required.");
        }

        const model = env.GEMINI_MODEL ?? "gemini-1.5-flash";
        const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: buildPrompt(transcript, accountId) }],
              },
            ],
            tools: [{ functionDeclarations }],
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Gemini error: ${response.status} ${response.statusText} ${body}`);
        }

        const data = await response.json();
        const call = extractFunctionCall(data);
        if (!call) {
          if (env.DEMO_MODE === true) {
            return mockGeminiAction(transcript, accountId);
          }
          throw new Error("Gemini response missing function call.");
        }
        return call;
      })();

  const proposed = mapToProposedAction(functionCall, accountId, safeTransferPayeeId, safeBillId);
  proposed.summary = summarizeProposedAction(proposed);
  return proposed;
};
