import { z } from "zod";

const booleanFromEnv = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid DEMO_MODE value: ${value}`);
};

const numberFromEnv = (value: string | undefined, name: string): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }
  return parsed;
};

const listFromEnv = (value: string | undefined): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
};

const demoAccountIdEnv = z.string().min(1).optional().parse(process.env.DEMO_ACCOUNT_ID);

export const demoMode = booleanFromEnv(process.env.DEMO_MODE) ?? false;
export const demoAccountId = demoAccountIdEnv ?? "demo-account-001";
export const knownGroceryMerchants =
  listFromEnv(process.env.DEMO_KNOWN_GROCERY_MERCHANTS) ??
  ["Whole Foods", "Trader Joes", "Safeway", "Kroger", "Aldi"];
export const knownElectricBillerName =
  process.env.DEMO_ELECTRIC_BILLER_NAME ?? "Pacific Energy";
export const knownSuspiciousPayeeName =
  process.env.DEMO_SUSPICIOUS_PAYEE_NAME ?? "Unknown Transfer Service";
export const highRiskTransferAmount =
  numberFromEnv(process.env.DEMO_HIGH_RISK_TRANSFER_AMOUNT, "DEMO_HIGH_RISK_TRANSFER_AMOUNT") ?? 2500;
