import { z } from "zod";
import { type ProposedAction } from "./actionTypes";

const queryFiltersSchema = z.object({
  merchant: z.string().min(1).optional(),
  since: z.string().min(1).optional(),
});

const basePayloadSchema = z.object({
  accountId: z.string().min(1),
  targetId: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(1).optional(),
  memo: z.string().min(1).optional(),
  queryFilters: queryFiltersSchema.optional(),
});

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("QUERY_SPEND"),
    summary: z.string().min(1),
    timestamp: z.string().min(1),
    payload: basePayloadSchema.extend({
      queryFilters: queryFiltersSchema.optional(),
    }),
    security: z.object({
      requiresConfirmation: z.boolean(),
      proposalId: z.string().min(1).optional(),
      confirmationToken: z.string().min(1).optional(),
    }),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("PROPOSE_TRANSFER"),
    summary: z.string().min(1),
    timestamp: z.string().min(1),
    payload: basePayloadSchema.extend({
      targetId: z.string().min(1),
      amount: z.number().positive(),
    }),
    security: z.object({
      requiresConfirmation: z.literal(true),
      proposalId: z.string().min(1).optional(),
      confirmationToken: z.string().min(1).optional(),
    }),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("PROPOSE_BILL_PAY"),
    summary: z.string().min(1),
    timestamp: z.string().min(1),
    payload: basePayloadSchema.extend({
      targetId: z.string().min(1),
      amount: z.number().positive(),
    }),
    security: z.object({
      requiresConfirmation: z.literal(true),
      proposalId: z.string().min(1).optional(),
      confirmationToken: z.string().min(1).optional(),
    }),
  }),
]);

export const validateProposedAction = (input: unknown): ProposedAction => {
  return actionSchema.parse(input) as ProposedAction;
};
